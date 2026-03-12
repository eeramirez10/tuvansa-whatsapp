import { NextFunction, Request, Response } from 'express';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { GetQuotesUseCase } from '../../application/use-cases/quotes/get-quotes.use-case';
import { GetQuoteById } from '../../application/use-cases/quotes/get-quote-by-id.use-case';
import { GetTodoDto } from '../../domain/dtos/quotes/get-todo.dto';
import { UpdateQuoteItemDto } from '../../domain/dtos/quotes/update-quote-item.dto';
import { UpdateQuoteItemUseCase } from '../../application/use-cases/quotes/update-quote-item.use-case';
import { GetQuotesDto } from '../../domain/dtos/quotes/get-quotes.dto';
import { UpdateQuoteWorkflowDto } from '../../domain/dtos/quotes/update-quote-workflow.dto';
import { UpdateQuoteWorkflowUseCase } from '../../application/use-cases/quotes/update-quote-workflow.use-case';

import { OpenAiFunctinsService } from '../../infrastructure/services/openai-functions.service';
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository';
import { SaveDraftDto } from '../../domain/dtos/versions/save-draft.dto';
import { SaveQuoteDraftUseCase } from '../../application/use-cases/quote-version/save-quote-draft.use-case';
import { ProcessQuoteFileExtractionUseCase } from '../../application/use-cases/quotes/process-quote-file-extraction.use-case';
import { SaveQuoteExtractionResultUseCase } from '../../application/use-cases/quotes/save-quote-extraction-result.use-case';
import { DeleteQuoteUseCase } from '../../application/use-cases/quotes/delete-quote.use-case';
import { SendInProgressQuoteRemindersUseCase } from '../../application/use-cases/whatsApp/send-in-progress-quote-reminders.use-case';

import { PrismaClient, UserRole } from '@prisma/client';
import { buildDisplayQuery } from '../../domain/parse/quotes/parse';
import { GetQuoteDisplayUseCase } from '../../application/use-cases/quotes/get-quote-display.use-case';
import { FileStorageService } from '../../domain/services/file-storage.service';
import { QuoteExtractionService } from '../../domain/services/quote-extraction.service';
import { UserRepository } from '../../domain/repositories/user-repository';
import { MessageService } from '../../domain/services/message.service';



export class QuotesController {

  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly quoteVersionRepository: QuoteVersionRepository,
    private readonly openAIService: OpenAiFunctinsService,
    private readonly prisma: PrismaClient,
    private readonly storage: FileStorageService,
    private readonly quoteExtractionService: QuoteExtractionService,
    private readonly userRepository: UserRepository,
    private readonly messageService: MessageService
  ) {

  }


  getQuotes = (req: Request, res: Response, next: NextFunction) => {

    const user = req.body.user

    const [error, getQuotesDto] = GetQuotesDto.execute({ ...req.query })


    if (error) {
      res.status(400).json({ error })
      return
    }

    if (!this.isAdmin(user)) {
      const allowedBranchIds = this.getUserBranchIds(user)
      if (allowedBranchIds.length === 0) {
        res.json({
          items: [],
          total: 0,
          page: Number(getQuotesDto.page ?? 1),
          pageSize: Number(getQuotesDto.pageSize ?? 20)
        })
        return
      }
      getQuotesDto.branchIds = allowedBranchIds
      getQuotesDto.branchId = undefined
    }

    new GetQuotesUseCase(this.quoteRepository, this.openAIService)
      .execute(getQuotesDto)
      .then((quotes) => {

        res.json(quotes)
      })
      .catch((e) => {
        console.log(e)
        res.status(500).json({ error: 'Hubo un error' })
      })

  }


  getQuote = (req: Request, res: Response, next: NextFunction) => {

    const id = req.params.id as string
    const user = req.body.user

    const [error] = GetTodoDto.execute({ id })

    if (error) {

      res
        .status(400)
        .json({ error })
      return
    }

    new GetQuoteById(this.quoteRepository)
      .execute(id)
      .then((quote) => {
        if (!quote) {
          res.status(404).json({ error: 'Cotización no encontrada' })
          return
        }

        if (!this.canAccessQuote(user, quote.branchId)) {
          res.status(403).json({ error: 'No tienes permiso para ver esta cotización' })
          return
        }

        res
          .json(quote)
      })
      .catch((e) => {
        console.log(e)
        res
          .status(500)
          .json({ error: 'Hubo un error' })
      })

  }

  updateQuoteWorkflowStatus = async (req: Request, res: Response) => {
    const quoteId = req.params.id as string
    const user = req.body.user

    const [idError] = GetTodoDto.execute({ id: quoteId })
    if (idError) {
      res.status(400).json({ error: idError })
      return
    }

    const [error, dto] = UpdateQuoteWorkflowDto.execute(req.body)
    if (error || !dto) {
      res.status(400).json({ error })
      return
    }

    try {
      const quote = await this.quoteRepository.getQuote(quoteId)
      if (!quote) {
        res.status(404).json({ error: 'Cotización no encontrada' })
        return
      }

      if (!this.canAccessQuote(user, quote.branchId)) {
        res.status(403).json({ error: 'No tienes permiso para modificar esta cotización' })
        return
      }

      const actorId = dto.workflowStatus === 'IN_PROGRESS'
        ? user?.id
        : this.isAdmin(user) ? undefined : user?.id

      const updated = await new UpdateQuoteWorkflowUseCase(this.quoteRepository)
        .execute(quoteId, dto, actorId)

      if (dto.workflowStatus === 'IN_PROGRESS' && user?.id) {
        try {
          await new SendInProgressQuoteRemindersUseCase(
            this.quoteRepository,
            this.userRepository,
            this.messageService
          ).executeImmediateForQuote({
            quoteId,
            ownerUserId: user.id
          })
        } catch (error) {
          console.warn(`[QuotesController] No se pudo enviar recordatorio inmediato COT-${updated.quoteNumber}`)
        }
      }

      res.json(updated)
    } catch (e) {
      console.log(e)
      res.status(500).json({ error: 'Hubo un error' })
    }
  }

  processQuoteFile = async (req: Request, res: Response) => {
    const quoteId = req.params.id as string
    const user = req.body.user

    const [idError] = GetTodoDto.execute({ id: quoteId })
    if (idError) {
      res.status(400).json({ error: idError })
      return
    }

    try {
      const quote = await this.quoteRepository.getQuote(quoteId)
      if (!quote) {
        res.status(404).json({ error: 'Cotización no encontrada' })
        return
      }

      if (!this.canAccessQuote(user, quote.branchId)) {
        res.status(403).json({ error: 'No tienes permiso para procesar esta cotización' })
        return
      }

      const fileKey = `${quote.fileKey ?? ''}`.trim()
      if (!fileKey) {
        res.status(400).json({ error: 'La cotización no tiene archivo adjunto para procesar' })
        return
      }

      const response = await new ProcessQuoteFileExtractionUseCase(
        this.quoteRepository,
        this.storage,
        this.quoteExtractionService
      ).execute({
        quoteId,
        fileKey
      })

      res.json(response)
    } catch (e) {
      console.log(e)
      const errorMessage = e instanceof Error ? e.message : 'Hubo un error al procesar el archivo'
      res.status(500).json({ error: errorMessage })
    }
  }

  saveQuoteExtractionResult = async (req: Request, res: Response) => {
    const quoteId = req.params.id as string
    const user = req.body.user

    const [idError] = GetTodoDto.execute({ id: quoteId })
    if (idError) {
      res.status(400).json({ error: idError })
      return
    }

    try {
      const quote = await this.quoteRepository.getQuote(quoteId)
      if (!quote) {
        res.status(404).json({ error: 'Cotización no encontrada' })
        return
      }

      if (!this.canAccessQuote(user, quote.branchId)) {
        res.status(403).json({ error: 'No tienes permiso para actualizar esta cotización' })
        return
      }

      const items = Array.isArray(req.body?.items) ? req.body.items : []
      const updatedQuote = await new SaveQuoteExtractionResultUseCase(this.quoteRepository).execute({
        quoteId,
        items
      })

      res.json({
        quote: updatedQuote,
        itemsCount: items.length
      })
    } catch (e) {
      console.log(e)
      const errorMessage = e instanceof Error ? e.message : 'Hubo un error al guardar la extracción'
      res.status(500).json({ error: errorMessage })
    }
  }

  deleteQuote = async (req: Request, res: Response) => {
    const quoteId = req.params.id as string
    const user = req.body.user

    const [idError] = GetTodoDto.execute({ id: quoteId })
    if (idError) {
      res.status(400).json({ error: idError })
      return
    }

    if (!this.isAdmin(user)) {
      res.status(403).json({ error: 'Solo un administrador puede eliminar cotizaciones' })
      return
    }

    try {
      const quote = await this.quoteRepository.getQuote(quoteId)
      if (!quote) {
        res.status(404).json({ error: 'Cotización no encontrada' })
        return
      }

      await new DeleteQuoteUseCase(this.quoteRepository).execute(quoteId)
      res.json({
        ok: true,
        message: `Cotización COT-${quote.quoteNumber} eliminada`
      })
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Hubo un error al eliminar la cotización' })
    }
  }


  updateQuote = (req: Request, res: Response) => {

    const id = req.params.id

    const [error, dto] = UpdateQuoteItemDto.execute(req.body)

    if (error) {
      res.status(401).json({ error })
      return
    }

    new UpdateQuoteItemUseCase(this.quoteRepository)
      .execute(id, dto)
      .then((data) => {
        res.json(data)
      })
      .catch((e) => {
        console.log(e)
        res
          .status(500)
          .json({ error: 'Hubo un error' })
      })

  }


  saveDraft = (req: Request, res: Response) => {

    const quoteId = req.params.quoteId
    const body = req.body
    const sellerId = req.body.user.id

    const [error, saveDraftDto] = SaveDraftDto.execute({ quoteId, ...body, sellerId })

    if (error) {
      res.status(400).json({ error })
      return
    }

    new SaveQuoteDraftUseCase(this.quoteVersionRepository)
      .execute(saveDraftDto)
      .then((resp) => res.json(resp))
      .catch((e) => {

        console.log(e)

        if (e instanceof Error) {

          return res.status(500).json({ error: 'Hubo un error [saveDraft]' })
        }
      })



  }


  getDisplay = (req: Request, res: Response) => {
    try {

      const quoteId = req.params.quoteId;
      if (!quoteId) {
        res.status(400).json({ ok: false, error: 'Missing quoteId' });
        return
      }

      const query = buildDisplayQuery({
        quoteId,
        prefer: req.query.prefer,
        include: req.query.include,
        presign: req.query.presign,
      });


      new GetQuoteDisplayUseCase(this.prisma, this.storage)
        .execute(query)
        .then((resp) => res.json({ ...resp }))
        .catch((e) => {
          res.status(500).json({ error: e })
        })


    } catch (error) {
      res.status(500).json({ error })
    }
  }


  getUploadedQuote = async (req: Request, res: Response) => {

    const filekeyName = req.params.filekeyName as string

    try {

      if (!filekeyName) {
        res.status(400).json({
          error: 'fileKeyName is required'
        })
        return
      }


      const url = await this.storage.generatePresignedUrl(filekeyName, 1800)


      res.json({ url })

      return


    } catch (error) {
      res.status(500).json({ error })
    }

  }

  getQuoteAttachmentFile = async (req: Request, res: Response) => {
    const quoteId = req.params.id as string
    const user = req.body.user

    const [idError] = GetTodoDto.execute({ id: quoteId })
    if (idError) {
      res.status(400).json({ error: idError })
      return
    }

    try {
      const quote = await this.quoteRepository.getQuote(quoteId)
      if (!quote) {
        res.status(404).json({ error: 'Cotización no encontrada' })
        return
      }

      if (!this.canAccessQuote(user, quote.branchId)) {
        res.status(403).json({ error: 'No tienes permiso para descargar esta cotización' })
        return
      }

      const fileKey = `${quote.fileKey ?? ''}`.trim()
      if (!fileKey) {
        res.status(400).json({ error: 'La cotización no tiene archivo adjunto' })
        return
      }

      const presignedUrl = await this.storage.generatePresignedUrl(fileKey, 600)
      const upstream = await fetch(presignedUrl)

      if (!upstream.ok) {
        res.status(500).json({ error: 'No se pudo obtener el archivo adjunto' })
        return
      }

      const fileBuffer = Buffer.from(await upstream.arrayBuffer())
      const fileName = fileKey.split('/').pop() || `quote-${quote.quoteNumber}`
      const contentType = upstream.headers.get('content-type') || 'application/octet-stream'

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      res.send(fileBuffer)
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Hubo un error al descargar el archivo adjunto' })
    }
  }

  private isAdmin(user: any): boolean {
    return user?.role === UserRole.ADMIN
  }

  private canAccessQuote(user: any, quoteBranchId?: string | null): boolean {
    if (!user) return false
    if (this.isAdmin(user)) return true
    if (!quoteBranchId) return false
    return this.getUserBranchIds(user).includes(quoteBranchId)
  }

  private getUserBranchIds(user: any): string[] {
    const values = [
      `${user?.branchId ?? ''}`.trim(),
      ...(Array.isArray(user?.branchIds) ? user.branchIds.map((branchId: unknown) => `${branchId ?? ''}`.trim()) : []),
      ...(Array.isArray(user?.branchAssignments) ? user.branchAssignments.map((item: any) => `${item?.branchId ?? ''}`.trim()) : [])
    ].filter(Boolean)

    const uniqueValues = [...new Set(values)]
    if (user?.role === UserRole.BRANCH_MANAGER) return uniqueValues
    if (uniqueValues.length === 0) return []
    return [uniqueValues[0]]
  }
}
