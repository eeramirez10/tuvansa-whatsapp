import { NextFunction, Request, Response } from 'express';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { GetQuotesUseCase } from '../../application/use-cases/quotes/get-quotes.use-case';
import { GetQuoteById } from '../../application/use-cases/quotes/get-quote-by-id.use-case';
import { GetTodoDto } from '../../domain/dtos/quotes/get-todo.dto';
import { UpdateQuoteItemDto } from '../../domain/dtos/quotes/update-quote-item.dto';
import { UpdateQuoteItemUseCase } from '../../application/use-cases/quotes/update-quote-item.use-case';
import { GetQuotesDto } from '../../domain/dtos/quotes/get-quotes.dto';

import { OpenAiFunctinsService } from '../../infrastructure/services/openai-functions.service';
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository';
import { SaveDraftDto } from '../../domain/dtos/versions/save-draft.dto';
import { SaveQuoteDraftUseCase } from '../../application/use-cases/quote-version/save-quote-draft.use-case';

import { PrismaClient } from '@prisma/client';
import { buildDisplayQuery } from '../../domain/parse/quotes/parse';
import { GetQuoteDisplayUseCase } from '../../application/use-cases/quotes/get-quote-display.use-case';
import { FileStorageService } from '../../domain/services/file-storage.service';
import { error } from 'console';



export class QuotesController {

  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly quoteVersionRepository: QuoteVersionRepository,
    private readonly openAIService: OpenAiFunctinsService,
    private readonly prisma: PrismaClient,
    private readonly storage: FileStorageService
  ) {

  }


  getQuotes = (req: Request, res: Response, next: NextFunction) => {


    const [error, getQuotesDto] = GetQuotesDto.execute({ ...req.query })


    if (error) {
      res.status(400).json({ error })
      return
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
}