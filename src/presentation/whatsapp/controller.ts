import { Request, Response } from "express";
import { EmailService } from '../../infrastructure/services/mail.service';
import { ChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import { QuoteRepository } from "../../domain/repositories/quote.repository";
import { CustomerRepository } from "../../domain/repositories/customer.repository";
import { MessageService } from '../../domain/services/message.service';
import { LanguageModelService } from "../../domain/services/language-model.service";
import { FileStorageService } from '../../domain/services/file-storage.service';
import { EnsureChatThreadForPhoneUseCase } from "../../application/use-cases/whatsApp/ensure-chat-thread-for-phone.use-case";
import { PrismaClient } from "@prisma/client";
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
import { ContactService } from '../../infrastructure/services/contacts.service';
import { MessageRepository } from '../../domain/repositories/message-repository';




enum Message {
  document,
  text
}

interface SendMessageRequest extends Request {
  body: SendMessageRequestDTO
}

const prisma = new PrismaClient

const ACCEPTED_FORMATS = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/pdf']
const FILE_REPLACEMENT_CANDIDATE_BODY = '__FILE_REPLACEMENT_CANDIDATE__'

const debounceTimers = new Map<string, NodeJS.Timeout>


export class WhatsAppController {

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
    private messageRepository: MessageRepository

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
      const contactService = new ContactService(
        new EmailService(),
        new WhatsAppNotificationService(this.messageService)
      );

      const toolCallHandlerFactory = new ToolCallHandlerFactory(
        this.customerRepository,
        this.quoteRepository,
        this.fileRepository,
        this.chatThreadRepository,
        this.branchRepository,
        this.messageRepository,
        this.messageService,
        contactService,
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
