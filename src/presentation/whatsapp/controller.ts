import { Request, Response } from "express";
import { EmailService } from '../../infrastructure/services/mail.service';
import { ChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import { QuoteRepository } from "../../domain/repositories/quote.repository";
import { CustomerRepository } from "../../domain/repositories/customer.repository";
import { MessageService } from '../../domain/services/message.service';
import { LanguageModelService } from "../../domain/services/language-model.service";
import { FileStorageService } from '../../domain/services/file-storage.service';
import { EnsureChatThreadForPhoneUseCase } from "../../application/use-cases/whatsApp/ensure-chat-thread-for-phone.use-case";
import { PrismaClient, WhatsAppWorkflowSessionType } from "@prisma/client";
import { UserQuestionQueueProcessor } from "../../application/use-cases/whatsApp/user-question-queue-processor.use-case";
import { UserQuestionCoreUseCase } from '../../application/use-cases/whatsApp/user-question-core.use-case';
import { SendMessageRequestDTO } from "../../domain/dtos/whatssapp/send-message-request.dto";
import { WhatsAppNotificationService } from "../../infrastructure/services/whatsapp-notification.service";
import { WhatsappTemplate } from "../../infrastructure/template/whatsapp/whatsapp-templates";
import { SendWhatssAppTemplateRequest } from "../../domain/dtos/whatssapp/send-whatss-app-template-request";
import { FileRepository } from '../../domain/repositories/file.repository';
import { SaveTemporaryFileRequestDTO } from "../../domain/dtos/file/save-temporary-file-request.dto";
import extname from 'ext-name'
import path from "path";
import url from "url";
import { BranchRepository } from '../../domain/repositories/branch.repository';
import { ToolCallHandlerFactory } from '../../application/use-cases/whatsApp/tool-handlers/tool-call-handler.factory';
import { OpenAiFunctinsService } from '../../infrastructure/services/openai-functions.service';
import { MessageRepository } from '../../domain/repositories/message-repository';
import { UpdateQuoteWorkflowDto } from "../../domain/dtos/quotes/update-quote-workflow.dto";
import { UpdateQuoteWorkflowUseCase } from "../../application/use-cases/quotes/update-quote-workflow.use-case";
import { QuoteEntity } from "../../domain/entities/quote.entity";
import { WorkflowActionRouter } from "../../application/use-cases/whatsApp/workflow-action-router";
import { buildWorkflowPayload } from "../../application/use-cases/whatsApp/workflow-payload";
import { FindInternalEmployeeByWaIdUseCase } from "../../application/use-cases/whatsApp/find-internal-employee-by-wa-id.use-case";
import { UserRepository } from '../../domain/repositories/user-repository';
import { InternalEmployeeResponseDto, UserRole } from "../../domain/dtos/users/internal-employee-response.dto";
import { DispatchQuoteNotificationsUseCase } from "../../application/use-cases/whatsApp/dispatch-quote-notifications.use-case";
import { QuoteNotificationEvent } from "../../domain/enums/notification.enum";
import { SendInProgressQuoteRemindersUseCase } from "../../application/use-cases/whatsApp/send-in-progress-quote-reminders.use-case";
interface SendMessageRequest extends Request {
  body: SendMessageRequestDTO
}



const prisma = new PrismaClient

const ACCEPTED_FORMATS = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/pdf']
const FILE_REPLACEMENT_CANDIDATE_BODY = '__FILE_REPLACEMENT_CANDIDATE__'

const debounceTimers = new Map<string, NodeJS.Timeout>


export class WhatsAppController {
  private readonly workflowActionRouter = new WorkflowActionRouter()
  private readonly pendingErpCaptureTtlMs = 24 * 60 * 60 * 1000
  private readonly pendingErpCaptureType = WhatsAppWorkflowSessionType.ERP_QUOTE_CAPTURE

  constructor(
    private openAIService: LanguageModelService,
    private emailService: EmailService,
    private chatThreadRepository: ChatThreadRepository,
    private quoteRepository: QuoteRepository,
    private customerRepository: CustomerRepository,
    private messageService: MessageService,
    private fileStorageService: FileStorageService,
    private fileRepository: FileRepository,
    private branchRepository: BranchRepository,
    private messageRepository: MessageRepository,
    private userRepository:UserRepository

  ) {


  }

  async webhookIncomingMessages(req: Request, res: Response) {

    const payload = req.body

    const {
      MediaContentType0,
      MessageType,
      WaId,
      Body,
      MediaUrl0,
    } = payload;



    try {
      const internalUser = await new FindInternalEmployeeByWaIdUseCase(this.userRepository).execute(WaId)

      if (internalUser && await this.shouldRouteToInternalWorkflow({...internalUser }, MessageType, Body, payload)) {
        await this.handleInternalEmployeeMessage({
          internalUser,
          waId: WaId,
          body: Body,
          messageType: MessageType,
          payload
        })
        return res.status(202).send('Accepted')
      }

      if (MessageType === 'text') {

        const { chatThread } = await
          new EnsureChatThreadForPhoneUseCase(
            this.openAIService,
            this.chatThreadRepository)
            .execute(WaId)

        const body = (Body ?? '').trim()

        const replacementCandidate = await prisma.pendingMessage.findFirst({
          where: {
            chatThreadId: chatThread.id,
            status: 'ERROR',
            body: FILE_REPLACEMENT_CANDIDATE_BODY,
            fileKey: {
              not: null
            }
          },
          select: {
            id: true,
            fileKey: true,
            originalFilename: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        if (replacementCandidate?.fileKey) {
          const normalizedBody = this.normalizeIncomingText(body)

          if (this.isAffirmativeReplacement(normalizedBody)) {
            const activePendingFile = await prisma.pendingMessage.findFirst({
              where: {
                chatThreadId: chatThread.id,
                fileKey: {
                  not: null
                },
                status: {
                  in: ['PENDING', 'PROCESSING']
                }
              },
              select: {
                id: true,
                fileKey: true,
                originalFilename: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            })

            if (activePendingFile) {
              await prisma.pendingMessage.update({
                where: { id: activePendingFile.id },
                data: { status: 'ERROR' }
              })

              await this.deleteTemporaryFileByKey(activePendingFile.fileKey)
            }

            await this.clearReplacementCandidates(chatThread.id, replacementCandidate.fileKey)

            await prisma.pendingMessage.create({
              data: {
                chatThreadId: chatThread.id,
                body: null,
                fileKey: replacementCandidate.fileKey,
                originalFilename: replacementCandidate.originalFilename ?? replacementCandidate.fileKey
              }
            })

            await prisma.pendingMessage.delete({
              where: {
                id: replacementCandidate.id
              }
            })

            const candidateName = this.resolveDisplayFilename(
              replacementCandidate.fileKey,
              replacementCandidate.originalFilename
            )
            const confirmationMessage = `Perfecto, usaré el archivo "${candidateName}" para tu cotización.`
            await this.messageService.createWhatsAppMessage({
              body: confirmationMessage,
              to: WaId
            })
            await this.messageRepository.createAssistantMessage({
              content: confirmationMessage,
              chatThreadId: chatThread.id,
              to: WaId
            })

            this.scheduleProcessing(WaId)
            return res.status(202).send('Accepted')
          }

          if (this.isNegativeReplacement(normalizedBody)) {
            await this.clearReplacementCandidates(chatThread.id)

            const keepCurrentMessage = 'Perfecto, conservaré el archivo anterior. Cuando termine, si gustas enviamos otro.'
            await this.messageService.createWhatsAppMessage({
              body: keepCurrentMessage,
              to: WaId
            })
            await this.messageRepository.createAssistantMessage({
              content: keepCurrentMessage,
              chatThreadId: chatThread.id,
              to: WaId
            })

            return res.status(202).send('Accepted')
          }

          const pendingName = this.resolveDisplayFilename(
            replacementCandidate.fileKey,
            replacementCandidate.originalFilename
          )
          const reminderMessage = `Por el momento solo puedo procesar un archivo por cotización. Tengo el archivo "${pendingName}" pendiente de confirmación. Responde "SI CAMBIAR" para usarlo o "NO CAMBIAR" para mantener el archivo anterior.`
          await this.messageService.createWhatsAppMessage({
            body: reminderMessage,
            to: WaId
          })
          await this.messageRepository.createAssistantMessage({
            content: reminderMessage,
            chatThreadId: chatThread.id,
            to: WaId
          })

          return res.status(202).send('Accepted')
        }

        await prisma.pendingMessage.create({
          data: {
            chatThreadId: chatThread.id,
            body: Body
          }
        })

        this.scheduleProcessing(WaId)

        return res.status(202).send('Accepted')

      }

      if (MessageType === 'document') {

        if (!ACCEPTED_FORMATS.includes(MediaContentType0)) {

          await this.messageService.createWhatsAppMessage({
            body: 'Por seguridad no puedo aceptar ese tipo de archivo, solo archivos con extension pdf o excel',
            to: WaId
          })

          return res.status(415).send('Unsupported Media Type')

        }

        const { chatThread } = await
          new EnsureChatThreadForPhoneUseCase(
            this.openAIService,
            this.chatThreadRepository)
            .execute(WaId)

        const mediaUrl = MediaUrl0
        const contentType = MediaContentType0
        const extension = extname.mime(contentType)[0].ext
        const mediaSid = path.basename(url.parse(mediaUrl).pathname);
        const filename = `${mediaSid}.${extension}`;
        const rawOriginalFilename = this.getIncomingOriginalFilename(payload)
        const originalFilename = this.normalizeOriginalFilename(
          rawOriginalFilename,
          filename
        );

        const activePendingFile = await prisma.pendingMessage.findFirst({
          where: {
            chatThreadId: chatThread.id,
            fileKey: {
              not: null
            },
            status: {
              in: ['PENDING', 'PROCESSING']
            }
          },
          select: {
            id: true,
            status: true,
            fileKey: true,
            originalFilename: true,
            updatedAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        })

        if (activePendingFile?.fileKey === filename) {
          console.log('[WhatsAppController] Duplicate file webhook ignored:', filename);
          return res.status(202).send('Accepted')
        }

        if (activePendingFile) {
          const now = Date.now();
          const updatedAtMs = activePendingFile.updatedAt.getTime();
          const staleThresholdMs = activePendingFile.status === 'PROCESSING'
            ? 15 * 60 * 1000
            : 30 * 60 * 1000;
          const isStale = now - updatedAtMs > staleThresholdMs;

          if (isStale) {
            console.warn('[WhatsAppController] Releasing stale pending file:', activePendingFile.id);
            await prisma.pendingMessage.update({
              where: { id: activePendingFile.id },
              data: { status: 'ERROR' }
            })
            await this.deleteTemporaryFileByKey(activePendingFile.fileKey)
          } else {
            const existingCandidate = await prisma.pendingMessage.findFirst({
              where: {
                chatThreadId: chatThread.id,
                status: 'ERROR',
                body: FILE_REPLACEMENT_CANDIDATE_BODY,
                fileKey: {
                  not: null
                }
              },
              select: {
                id: true,
                fileKey: true,
                originalFilename: true
              },
              orderBy: {
                createdAt: 'desc'
              }
            })

            if (existingCandidate?.fileKey === filename) {
              console.log('[WhatsAppController] Duplicate replacement candidate ignored:', filename);
              return res.status(202).send('Accepted')
            }

            if (existingCandidate?.id && existingCandidate.fileKey) {
              await this.deleteTemporaryFileByKey(existingCandidate.fileKey)
              await prisma.pendingMessage.delete({
                where: {
                  id: existingCandidate.id
                }
              })
            }

            const resolvedOriginalFilename = await this.saveIncomingTemporaryFile({
              mediaUrl,
              contentType,
              filename,
              originalFilename,
              chatThreadId: chatThread.id
            })

            await prisma.pendingMessage.create({
              data: {
                chatThreadId: chatThread.id,
                body: FILE_REPLACEMENT_CANDIDATE_BODY,
                fileKey: filename,
                originalFilename: resolvedOriginalFilename,
                status: 'ERROR'
              }
            })

            const activeName = this.resolveDisplayFilename(
              activePendingFile.fileKey,
              activePendingFile.originalFilename
            )
            const candidateName = this.resolveDisplayFilename(filename, resolvedOriginalFilename)
            const replaceMessage = `Por el momento solo puedo procesar un archivo por cotización. Ya tengo un archivo pendiente ("${activeName}"). Si deseas reemplazarlo por este nuevo archivo ("${candidateName}"), responde "SI CAMBIAR". Si prefieres mantener el anterior, responde "NO CAMBIAR".`
            await this.messageService.createWhatsAppMessage({
              body: replaceMessage,
              to: WaId
            })

            await this.messageRepository.createAssistantMessage({
              content: replaceMessage,
              chatThreadId: chatThread.id,
              to: WaId
            })

            return res.status(202).send('Accepted')
          }
        }

        await this.clearReplacementCandidates(chatThread.id)

        const resolvedOriginalFilename = await this.saveIncomingTemporaryFile({
          mediaUrl,
          contentType,
          filename,
          originalFilename,
          chatThreadId: chatThread.id
        })

        await prisma.pendingMessage.create({
          data: {
            chatThreadId: chatThread.id,
            body: null,
            fileKey: filename,
            originalFilename: resolvedOriginalFilename
          }
        })


        this.scheduleProcessing(WaId)

        return res.status(202).send('Accepted')

      }



    } catch (error) {
      console.log(error)

      res
        .status(500)
        .json({
          error: 'Ocurrio un error'
        })
    }


  }

  async sendEmail(req: Request, res: Response) {

    try {
      await this.emailService.sendEmail({
        to: ['eeramirez@tuvansa.com.mx'],
        subject: "test",
        htmlBody: "mensaje de prueba"
      })

      res.json({
        ok: true,
        msg: 'Enviado correctamente'
      })

    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Hubo un error' })
    }


  }


  SendWhatsApp(req: SendMessageRequest, res: Response) {
    const [error, sendMessageRequestDTO] = SendMessageRequestDTO.execute({ ...req.body })
    if (error) {
      res.status(401).json({ error })
      return
    }

    this.messageService
      .createWhatsAppMessage({
        body: sendMessageRequestDTO.message,
        to: sendMessageRequestDTO.to
      })
      .then((resp) => {
        res.json(resp)
      }).catch((error) => {
        console.log(error)
      })


  }

  sendWhatssAppTemplate = (req: SendWhatssAppTemplateRequest, res: Response) => {

    const waNotificationService = new WhatsAppNotificationService(this.messageService);

    const body = { ...req.body }

    waNotificationService
      .sendTemplateMessage(
        WhatsappTemplate.QUOTE_WEB_NOTIFICATION_ICONS,
        {
          to: body.to,
          quote: { summary: body.summary },
          url: body.url
        }
      )
      .then(resp => {
        return res.json(resp)
      })
      .catch((error) => {
        console.log(error)
      })
  }

  private async handleInternalEmployeeMessage(options: {
    internalUser: InternalEmployeeResponseDto
    waId: string
    body?: string
    messageType?: string
    payload?: Record<string, any>
  }): Promise<void> {
    const { internalUser, waId, body, messageType, payload } = options
    const { chatThread } = await new EnsureChatThreadForPhoneUseCase(
      this.openAIService,
      this.chatThreadRepository
    ).execute(waId)

    const incomingBody = (body ?? '').trim()
    let action = this.workflowActionRouter.route({
      body: incomingBody,
      messageType,
      payload
    })
    const pendingErpCapture = await this.getPendingErpCapture(internalUser.id)
    const normalizedIncomingBody = this.normalizeIncomingText(incomingBody)

    await this.messageRepository.createUserMessage({
      content: incomingBody || action.raw || `[${messageType ?? 'unknown'}]`,
      chatThreadId: chatThread.id,
      from: waId
    })

    if (!this.canManageWorkflow(internalUser)) {
      await this.sendInternalReply(
        chatThread.id,
        waId,
        'Tu número es interno y no tiene permisos para workflow de cotizaciones.'
      )
      return
    }

    if (pendingErpCapture && this.isCancelPendingErpCapture(normalizedIncomingBody)) {
      await this.clearPendingErpCapture(internalUser.id)
      await this.sendInternalReply(
        chatThread.id,
        waId,
        `Cancelé la captura del folio ERP para COT-${pendingErpCapture.quoteNumber}.`
      )
      return
    }

    if (pendingErpCapture && action.type === 'UNKNOWN') {
      const erpQuoteNumber = this.extractErpQuoteNumber(incomingBody)
      if (erpQuoteNumber) {
        action = {
          type: 'QUOTED',
          quoteNumber: pendingErpCapture.quoteNumber,
          erpQuoteNumber,
          source: 'text',
          raw: incomingBody
        }
      }
    }

    if (action.type === 'HELP' || action.type === 'UNKNOWN' || !action.quoteNumber) {
      if (pendingErpCapture) {
        await this.sendInternalReply(
          chatThread.id,
          waId,
          `Estoy esperando solo el folio ERP para COT-${pendingErpCapture.quoteNumber}. Envíalo como texto (ej. PRO-12345) o escribe "CANCELAR".`
        )
        return
      }
      await this.sendInternalReply(chatThread.id, waId, this.buildInternalWorkflowHelpMessage())
      return
    }

    const quote = await this.quoteRepository.findByQuoteNumber({ quoteNumber: action.quoteNumber })
    if (!quote) {
      await this.clearPendingErpCapture(internalUser.id)
      await this.sendInternalReply(chatThread.id, waId, `No encontré la cotización COT-${action.quoteNumber}.`)
      return
    }

    if (!this.canAccessWorkflowQuote(internalUser, quote.branchId)) {
      await this.clearPendingErpCapture(internalUser.id)
      await this.sendInternalReply(
        chatThread.id,
        waId,
        `No tienes permiso para gestionar la cotización COT-${quote.quoteNumber}.`
      )
      return
    }

    if (action.type === 'VIEW') {
      await this.clearPendingErpCapture(internalUser.id)
      await this.updateWorkflowFromWhatsApp(quote.id, { workflowStatus: 'VIEWED' }, internalUser.id)
      await this.dispatchWorkflowNotification(QuoteNotificationEvent.QUOTE_VIEWED, quote, internalUser)

      const summary = this.formatInternalQuoteSummary(quote)
      const templateSent = await this.sendWorkflowViewedTemplate({
        to: waId,
        chatThreadId: chatThread.id,
        quote,
        summary
      })
      if (!templateSent) {
        await this.sendInternalReply(
          chatThread.id,
          waId,
          `COT-${quote.quoteNumber} marcada como VISTA. ${summary} Responde "DESCARGAR ${quote.quoteNumber}" para obtener el archivo o "RECHAZAR ${quote.quoteNumber} motivo".`
        )
      }
      return
    }

    if (action.type === 'DOWNLOAD') {
      await this.clearPendingErpCapture(internalUser.id)
      await this.updateWorkflowFromWhatsApp(quote.id, { workflowStatus: 'DOWNLOADED' }, internalUser.id)
      await this.dispatchWorkflowNotification(QuoteNotificationEvent.QUOTE_DOWNLOADED, quote, internalUser)

      if (!quote.fileKey) {
        await this.sendInternalReply(
          chatThread.id,
          waId,
          `COT-${quote.quoteNumber} marcada como DESCARGADA. Esta cotización no tiene archivo adjunto para enviar.`
        )
        return
      }

      const presignedUrl = await this.fileStorageService.generatePresignedUrl(quote.fileKey, 1800)
      const mediaBody = `COT-${quote.quoteNumber} marcada como DESCARGADA. Aquí tienes el archivo.`
      await this.messageService.sendMediaMessage({
        to: waId,
        body: mediaBody,
        mediaUrl: presignedUrl
      })

      await this.messageRepository.createAssistantMessage({
        content: mediaBody,
        chatThreadId: chatThread.id,
        to: waId
      })

      const summary = this.formatInternalQuoteSummary(quote)
      const postDownloadTemplateSent = await this.sendWorkflowPostDownloadTemplate({
        to: waId,
        chatThreadId: chatThread.id,
        quote,
        summary
      })
      if (!postDownloadTemplateSent) {
        await this.sendInternalReply(
          chatThread.id,
          waId,
          `Responde "ACEPTAR ${quote.quoteNumber}" para pasarla a EN PROGRESO o "RECHAZAR ${quote.quoteNumber} <motivo>" si no corresponde al ramo.`
        )
      }
      return
    }

    if (action.type === 'ACCEPT') {
      await this.clearPendingErpCapture(internalUser.id)
      await this.updateWorkflowFromWhatsApp(
        quote.id,
        { workflowStatus: 'IN_PROGRESS' },
        internalUser.id
      )
      await this.dispatchWorkflowNotification(QuoteNotificationEvent.QUOTE_IN_PROGRESS, quote, internalUser)
      try {
        await new SendInProgressQuoteRemindersUseCase(
          this.quoteRepository,
          this.userRepository,
          this.messageService
        ).executeImmediateForQuote({
          quoteId: quote.id,
          ownerUserId: internalUser.id
        })
      } catch (error) {
        console.warn(`[WhatsAppController] No se pudo enviar recordatorio inmediato COT-${quote.quoteNumber}`)
      }

      await this.sendInternalReply(
        chatThread.id,
        waId,
        `COT-${quote.quoteNumber} marcada como EN PROGRESO. Cuando la cotización esté lista, responde "COTIZADA ${quote.quoteNumber} <folio_erp>".`
      )
      return
    }

    if (action.type === 'REJECT_MENU') {
      await this.clearPendingErpCapture(internalUser.id)
      const rejectReasonsTemplateSent = await this.sendWorkflowRejectReasonsTemplate({
        to: waId,
        chatThreadId: chatThread.id,
        quote
      })

      if (!rejectReasonsTemplateSent) {
        await this.sendInternalReply(
          chatThread.id,
          waId,
          `Elige motivo de rechazo para COT-${quote.quoteNumber}: 1) No es cotización 2) No aplica 3) Cliente rechazó oferta 4) Sin respuesta cliente 5) Precio fuera presupuesto.`
        )
      }
      return
    }

    if (action.type === 'QUOTED') {
      if (!action.erpQuoteNumber) {
        await this.setPendingErpCapture(internalUser.id, quote.quoteNumber)
        await this.sendInternalReply(
          chatThread.id,
          waId,
          `Indica el folio ERP para COT-${quote.quoteNumber}. Puedes enviar solo el folio (ej. PRO-12345) o usar: COTIZADA ${quote.quoteNumber} <folio_erp>.`
        )
        return
      }

      await this.updateWorkflowFromWhatsApp(
        quote.id,
        {
          workflowStatus: 'QUOTED',
          erpQuoteNumber: action.erpQuoteNumber,
          erpSystem: 'PROSCAI'
        },
        internalUser.id
      )
      await this.dispatchWorkflowNotification(QuoteNotificationEvent.QUOTE_QUOTED, quote, internalUser)
      await this.clearPendingErpCapture(internalUser.id)

      await this.sendInternalReply(
        chatThread.id,
        waId,
        `COT-${quote.quoteNumber} marcada como COTIZADA. Referencia ERP registrada: ${action.erpQuoteNumber}.`
      )
      return
    }

    await this.clearPendingErpCapture(internalUser.id)
    await this.updateWorkflowFromWhatsApp(
      quote.id,
      {
        workflowStatus: 'REJECTED',
        rejectedReason: action.reason
      },
      internalUser.id
    )
    await this.dispatchWorkflowNotification(QuoteNotificationEvent.QUOTE_REJECTED, quote, internalUser)

    await this.sendInternalReply(
      chatThread.id,
      waId,
      `COT-${quote.quoteNumber} marcada como RECHAZADA${action.reason ? ` (${action.reason})` : ''}.`
    )
  }

  private async updateWorkflowFromWhatsApp(
    quoteId: string,
    payload: {
      workflowStatus: string
      erpQuoteNumber?: string
      erpSystem?: string
      rejectedReason?: string
      erpInvoiceNumber?: string
    },
    updatedById: string
  ): Promise<void> {
    const [error, dto] = UpdateQuoteWorkflowDto.execute(payload)
    if (error || !dto) {
      throw new Error(error ?? 'No se pudo actualizar el workflow')
    }

    await new UpdateQuoteWorkflowUseCase(this.quoteRepository).execute(quoteId, dto, updatedById)
  }

  private buildInternalWorkflowHelpMessage(): string {
    return 'Comandos internos: VER <folio>, DESCARGAR <folio>, ACEPTAR <folio>, COTIZADA <folio> <folio_erp>, RECHAZAR <folio> <motivo>. Plantillas: WF:VIEW:<folio>, WF:DOWNLOAD:<folio>, WF:ACCEPT:<folio>, WF:QUOTED:<folio>:<folio_erp>, WF:REJECTED:<folio>:<motivo>.'
  }

  private formatInternalQuoteSummary(quote: QuoteEntity): string {
    const customerName = [quote.customer?.name, quote.customer?.lastname].filter(Boolean).join(' ').trim() || 'Cliente sin nombre'
    const items = quote.items ?? []
    const preview = items.slice(0, 3).map((item) => `${item.description} x${item.quantity}`).join(' | ')
    const suffix = items.length > 3 ? ' | ...' : ''
    return `Cliente: ${customerName}. Items: ${items.length}${preview ? ` (${preview}${suffix})` : ''}.`
  }

  private canManageWorkflow(user: InternalEmployeeResponseDto): boolean {
    return user.role === UserRole.ADMIN || user.role === UserRole.BRANCH_MANAGER
  }

  private canAccessWorkflowQuote(user: InternalEmployeeResponseDto, quoteBranchId?: string | null): boolean {
    if (user.role === UserRole.ADMIN) return true
    if (user.role !== UserRole.BRANCH_MANAGER) return false
    if (!quoteBranchId) return false
    return this.getInternalUserBranchIds(user).includes(quoteBranchId)
  }

  private getInternalUserBranchIds(user: InternalEmployeeResponseDto): string[] {
    const values = [
      `${user.branchId ?? ''}`.trim(),
      ...(Array.isArray(user.branchIds) ? user.branchIds.map((branchId) => `${branchId ?? ''}`.trim()) : [])
    ].filter(Boolean)
    return [...new Set(values)]
  }

  private async shouldRouteToInternalWorkflow(
    internalUser: InternalEmployeeResponseDto,
    messageType: string,
    body?: string,
    payload?: Record<string, any>
  ): Promise<boolean> {
    if (!internalUser.allowWhatsappAssistant) return true

    const pendingErpCapture = await this.getPendingErpCapture(internalUser.id)
    if (pendingErpCapture) return true

    const action = this.workflowActionRouter.route({
      body: `${body ?? ''}`.trim(),
      messageType,
      payload
    })
    return action.type !== 'UNKNOWN'
  }

  private async sendInternalReply(chatThreadId: string, to: string, content: string): Promise<void> {
    await this.messageService.createWhatsAppMessage({
      to,
      body: content
    })

    await this.messageRepository.createAssistantMessage({
      content,
      chatThreadId,
      to
    })
  }

  private async dispatchWorkflowNotification(
    event: QuoteNotificationEvent,
    quote: QuoteEntity,
    internalUser: InternalEmployeeResponseDto
  ): Promise<void> {
    try {
      await new DispatchQuoteNotificationsUseCase(
        this.userRepository,
        this.messageService
      ).execute({
        event,
        quote,
        summary: this.formatInternalQuoteSummary(quote),
        actorUserId: internalUser.id,
        actorLabel: internalUser.name
      })
    } catch (error) {
      console.warn(`[WhatsAppController] No se pudo despachar notificación ${event} COT-${quote.quoteNumber}`)
    }
  }

  private async sendWorkflowViewedTemplate(options: {
    to: string
    chatThreadId: string
    quote: QuoteEntity
    summary: string
  }): Promise<boolean> {
    const { to, chatThreadId, quote, summary } = options
    const quoteNumber = quote.quoteNumber

    try {
      await new WhatsAppNotificationService(this.messageService).sendTemplateMessage(
        WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_VIEWED,
        {
          to,
          quote: { summary },
          workflow: {
            quoteNumber,
            actionDownload: buildWorkflowPayload('DOWNLOAD', quoteNumber)
          }
        }
      )

      const logMessage = `Template workflow VIEWED enviado para COT-${quoteNumber}.`
      await this.messageRepository.createAssistantMessage({
        content: logMessage,
        chatThreadId,
        to
      })
      return true
    } catch (error) {
      console.warn(`[WhatsAppController] Workflow VIEWED template fallback COT-${quoteNumber}`)
      return false
    }
  }

  private async sendWorkflowPostDownloadTemplate(options: {
    to: string
    chatThreadId: string
    quote: QuoteEntity
    summary: string
  }): Promise<boolean> {
    const { to, chatThreadId, quote, summary } = options
    const quoteNumber = quote.quoteNumber

    try {
      await new WhatsAppNotificationService(this.messageService).sendTemplateMessage(
        WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_AFTER_DOWNLOAD,
        {
          to,
          quote: { summary },
          workflow: {
            quoteNumber,
            actionAccept: buildWorkflowPayload('ACCEPT', quoteNumber),
            actionRejectMenu: buildWorkflowPayload('REJECT_MENU', quoteNumber)
          }
        }
      )

      const logMessage = `Template workflow AFTER_DOWNLOAD enviado para COT-${quoteNumber}.`
      await this.messageRepository.createAssistantMessage({
        content: logMessage,
        chatThreadId,
        to
      })
      return true
    } catch (error) {
      console.warn(`[WhatsAppController] Workflow AFTER_DOWNLOAD template fallback COT-${quoteNumber}`)
      return false
    }
  }

  private async sendWorkflowRejectReasonsTemplate(options: {
    to: string
    chatThreadId: string
    quote: QuoteEntity
  }): Promise<boolean> {
    const { to, chatThreadId, quote } = options
    const quoteNumber = quote.quoteNumber

    try {
      await new WhatsAppNotificationService(this.messageService).sendTemplateMessage(
        WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_REJECT_REASON_PENDING_ERP,
        {
          to,
          workflow: {
            quoteNumber,
            actionRejectNotQuote: buildWorkflowPayload('REJECTED', quoteNumber, 'No es una cotización'),
            actionRejectOutOfScope: buildWorkflowPayload('REJECTED', quoteNumber, 'No aplica'),
            actionRejectClientDeclined: buildWorkflowPayload('REJECTED', quoteNumber, 'Cliente rechazó la oferta'),
            actionRejectNoResponse: buildWorkflowPayload('REJECTED', quoteNumber, 'Sin respuesta del cliente'),
            actionRejectTooExpensive: buildWorkflowPayload('REJECTED', quoteNumber, 'Precio fuera de presupuesto')
          }
        }
      )

      const logMessage = `Template workflow REJECT_REASONS enviado para COT-${quoteNumber}.`
      await this.messageRepository.createAssistantMessage({
        content: logMessage,
        chatThreadId,
        to
      })
      return true
    } catch (error) {
      console.warn(`[WhatsAppController] Workflow REJECT_REASONS template fallback COT-${quoteNumber}`)
      return false
    }
  }

  // private async findInternalEmployeeByWaId(waId: string): Promise<InternalEmployeeUser | null> {
  //   const normalized = this.normalizePhone(waId)
  //   if (!normalized) return null

  //   const exactCandidates = [waId, normalized, `+${normalized}`].filter(Boolean)
  //   const last10 = normalized.slice(-10)

  //   const queryOr: Array<Record<string, any>> = exactCandidates.map((phone) => ({ phone }))
  //   if (last10.length === 10) {
  //     queryOr.push({ phone: { endsWith: last10 } })
  //     console.log({ last10 })
  //   }

  //   console.log({ queryOr })

  //   return prisma.user.findFirst({
  //     where: {
  //       isActive: true,
  //       phone: { not: null },
  //       OR: queryOr
  //     },
  //     select: {
  //       id: true,
  //       name: true,
  //       role: true,
  //       branchId: true,
  //       phone: true,
  //       allowWhatsappAssistant: true
  //     }
  //   })
  // }

  private async setPendingErpCapture(userId: string, quoteNumber: number): Promise<void> {
    const expiresAt = new Date(Date.now() + this.pendingErpCaptureTtlMs)

    await prisma.whatsAppWorkflowSession.upsert({
      where: {
        userId_type: {
          userId,
          type: this.pendingErpCaptureType
        }
      },
      update: {
        quoteNumber,
        expiresAt
      },
      create: {
        userId,
        quoteNumber,
        type: this.pendingErpCaptureType,
        expiresAt
      }
    })
  }

  private async getPendingErpCapture(userId: string): Promise<{ quoteNumber: number } | null> {
    const pending = await prisma.whatsAppWorkflowSession.findUnique({
      where: {
        userId_type: {
          userId,
          type: this.pendingErpCaptureType
        }
      },
      select: {
        quoteNumber: true,
        expiresAt: true
      }
    })

    if (!pending) return null

    if (pending.expiresAt.getTime() <= Date.now()) {
      await this.clearPendingErpCapture(userId)
      return null
    }

    return {
      quoteNumber: pending.quoteNumber
    }
  }

  private async clearPendingErpCapture(userId: string): Promise<void> {
    await prisma.whatsAppWorkflowSession.deleteMany({
      where: {
        userId,
        type: this.pendingErpCaptureType
      }
    })
  }

  private isCancelPendingErpCapture(normalizedBody: string): boolean {
    return normalizedBody === 'cancelar' || normalizedBody === 'cancel'
  }

  private extractErpQuoteNumber(body: string): string | null {
    const trimmed = `${body ?? ''}`.trim()
    if (!trimmed || trimmed.length > 64) return null

    const normalized = this.normalizeIncomingText(trimmed)
    if (normalized === 'ayuda' || normalized === 'help' || normalized === 'menu') return null

    const looksLikeWorkflowCommand = /^(ver|vista|descargar|descargado|aceptar|aceptada|aceptado|en\s+progreso|rechazar|rechazada|rechazado|descartar|descartada|descartado|cotizada|cotizado)\b/i.test(trimmed)
    if (looksLikeWorkflowCommand) return null

    return trimmed
  }


  private normalizeIncomingText = (value: string): string => {
    return (value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  private getIncomingOriginalFilename = (payload: Record<string, any>): string | undefined => {
    const directCandidates = [
      payload?.Body,
      payload?.body,
      payload?.MediaFilename0,
      payload?.MediaFileName0,
      payload?.MediaFilename,
      payload?.MediaFileName,
      payload?.mediaFilename0,
      payload?.mediaFileName0,
      payload?.mediaFilename,
      payload?.mediaFileName,
      payload?.Filename,
      payload?.FileName,
      payload?.filename,
      payload?.fileName,
    ]

    const directMatch = directCandidates.find((value) =>
      typeof value === 'string' &&
      value.trim().length > 0 &&
      this.isLikelyFilename(value)
    )
    if (directMatch) return directMatch

    const channelMetadata = payload?.ChannelMetadata
    if (typeof channelMetadata === 'string') {
      try {
        const parsed = JSON.parse(channelMetadata)
        const metadataFilename = this.findFilenameInObject(parsed)
        if (metadataFilename) return metadataFilename
      } catch (error) {
        console.warn('[WhatsAppController] ChannelMetadata is not valid JSON')
      }
    }

    return undefined
  }

  private findFilenameInObject = (value: unknown): string | undefined => {
    if (!value || typeof value !== 'object') return undefined

    const queue: unknown[] = [value]

    while (queue.length > 0) {
      const current = queue.shift()
      if (!current || typeof current !== 'object') continue

      for (const [rawKey, rawValue] of Object.entries(current as Record<string, unknown>)) {
        const key = rawKey.toLowerCase()

        if (
          typeof rawValue === 'string' &&
          key.includes('filename') &&
          rawValue.trim().length > 0 &&
          this.isLikelyFilename(rawValue)
        ) {
          return rawValue
        }

        if (rawValue && typeof rawValue === 'object') {
          queue.push(rawValue)
        }
      }
    }

    return undefined
  }

  private normalizeOriginalFilename = (incomingFilename: string | undefined, fallbackFilename: string): string => {
    const fallback = path.basename(fallbackFilename) || fallbackFilename

    if (!incomingFilename || typeof incomingFilename !== 'string') {
      return fallback
    }

    const trimmed = incomingFilename.trim()
    if (!trimmed) return fallback

    const base = path.basename(trimmed)
      .replace(/[<>:"|?*\u0000-\u001f]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()

    if (!base) return fallback

    const hasExtension = path.extname(base).length > 0
    if (hasExtension) return base

    const fallbackExtension = path.extname(fallback)
    return fallbackExtension ? `${base}${fallbackExtension}` : base
  }

  private isLikelyFilename = (value: string): boolean => {
    const clean = path.basename(value.trim())
    if (!clean) return false
    return path.extname(clean).length > 1
  }

  private resolveDisplayFilename = (fileKey?: string | null, originalFilename?: string | null): string => {
    const cleanOriginal = (originalFilename ?? '').trim()
    if (cleanOriginal) return cleanOriginal
    return fileKey ?? 'archivo'
  }

  private isAffirmativeReplacement = (normalizedText: string): boolean => {
    if (!normalizedText) return false

    const exactMatches = new Set([
      'si',
      'ok',
      'va',
      'dale',
      'adelante',
      'cambiar',
      'reemplazar',
      'si cambiar',
      'si reemplazar',
      'confirmo',
      'usar este',
      'usa este',
      'si cambialo',
      'cambialo',
    ])

    if (exactMatches.has(normalizedText)) return true
    if (normalizedText.includes('si cambiar')) return true
    if (normalizedText.includes('si reemplazar')) return true
    if (normalizedText.includes('reemplaz')) return true
    if (normalizedText.includes('cambiar')) return true
    return false
  }

  private isNegativeReplacement = (normalizedText: string): boolean => {
    if (!normalizedText) return false

    const exactMatches = new Set([
      'no',
      'no cambiar',
      'no reemplazar',
      'mantener',
      'conservar',
      'deja el anterior',
      'quedate con el anterior',
      'no cambies',
    ])

    if (exactMatches.has(normalizedText)) return true
    if (normalizedText.includes('no cambiar')) return true
    if (normalizedText.includes('no reemplazar')) return true
    if (normalizedText.includes('mantener')) return true
    if (normalizedText.includes('conservar')) return true
    return false
  }

  private deleteTemporaryFileByKey = async (fileKey?: string | null): Promise<void> => {
    if (!fileKey) return

    const tempFile = await prisma.temporaryFile.findUnique({
      where: {
        fileKey
      },
      select: {
        id: true
      }
    })

    if (!tempFile?.id) return

    await this.fileRepository.deleteFile(tempFile.id)
  }

  private clearReplacementCandidates = async (chatThreadId: string, keepFileKey?: string): Promise<void> => {
    const candidates = await prisma.pendingMessage.findMany({
      where: {
        chatThreadId,
        status: 'ERROR',
        body: FILE_REPLACEMENT_CANDIDATE_BODY,
        fileKey: {
          not: null
        }
      },
      select: {
        id: true,
        fileKey: true
      }
    })

    for (const candidate of candidates) {
      if (keepFileKey && candidate.fileKey === keepFileKey) {
        continue
      }

      await this.deleteTemporaryFileByKey(candidate.fileKey)

      await prisma.pendingMessage.delete({
        where: {
          id: candidate.id
        }
      })
    }
  }

  private saveIncomingTemporaryFile = async (options: {
    mediaUrl: string
    contentType: string
    filename: string
    originalFilename: string
    chatThreadId: string
  }): Promise<string> => {
    const { mediaUrl, contentType, filename, originalFilename, chatThreadId } = options

    const fileDownload = await this.messageService.getFileFromUrl(mediaUrl)
    const resolvedOriginalFilename = this.normalizeOriginalFilename(
      fileDownload.originalFilename ?? originalFilename,
      filename
    )

    if (resolvedOriginalFilename === filename) {
      console.warn('[WhatsAppController] Original filename unavailable from provider; using fileKey as fallback')
    }

    const fileStream = fileDownload.stream
    const chunks: Uint8Array[] = []

    for await (const chunk of fileStream) {
      chunks.push(chunk)
    }

    const fileBuffer = Buffer.concat(chunks)
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)

    await this.deleteTemporaryFileByKey(filename)

    const saveTemporaryFile = new SaveTemporaryFileRequestDTO({
      filename,
      originalFilename: resolvedOriginalFilename,
      fileBuffer: arrayBuffer,
      mimeType: contentType,
      chatThreadId
    })

    await this.fileRepository.saveTemporaryFile(saveTemporaryFile)
    return resolvedOriginalFilename
  }



  private scheduleProcessing = (phoneWa: string) => {
    const existingTimer = debounceTimers.get(phoneWa)

    if (existingTimer) {
      clearTimeout(existingTimer)
    }



    const timer = setTimeout(() => {

      // Create factory with all dependencies
      const openAiFunctions = new OpenAiFunctinsService();
      const toolCallHandlerFactory = new ToolCallHandlerFactory(
        this.customerRepository,
        this.quoteRepository,
        this.fileRepository,
        this.chatThreadRepository,
        this.branchRepository,
        this.userRepository,
        this.messageRepository,
        this.messageService,
        this.fileStorageService,
        openAiFunctions,

      );


      const userQuestionCore = new UserQuestionCoreUseCase(
        this.openAIService,
        this.messageService,
        toolCallHandlerFactory,
        this.messageRepository
      )

      new UserQuestionQueueProcessor(
        this.openAIService,
        this.chatThreadRepository,
        userQuestionCore
      ).execute(phoneWa)
        .catch((err) => console.error('[QueueProcessor error]', err));

    }, 5_000)

    debounceTimers.set(phoneWa, timer)
  }




}
