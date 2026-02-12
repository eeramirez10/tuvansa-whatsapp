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




enum Message {
  document,
  text
}

interface SendMessageRequest extends Request {
  body: SendMessageRequestDTO
}

const prisma = new PrismaClient

const ACCEPTED_FORMATS = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/pdf']

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
    private fileRepository: FileRepository

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

        const mediaUrl = MediaUrl0
        const contentType = MediaContentType0
        const extension = extname.mime(contentType)[0].ext
        const mediaSid = path.basename(url.parse(mediaUrl).pathname);
        const filename = `${mediaSid}.${extension}`;

        const fileStream = await this.messageService.getFileFromUrl(mediaUrl)
        const chunks: Uint8Array[] = []

        for await (const chunk of fileStream) {
          chunks.push(chunk)
        }

        const fileBuffer = Buffer.concat(chunks)

        const { chatThread } = await
          new EnsureChatThreadForPhoneUseCase(
            this.openAIService,
            this.chatThreadRepository)
            .execute(WaId)

        const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);
        const saveTemporaryFile = new SaveTemporaryFileRequestDTO({ filename, fileBuffer: arrayBuffer, mimeType: contentType, chatThreadId: chatThread.id })

        await this.fileRepository.saveTemporaryFile(saveTemporaryFile)

        await prisma.pendingMessage.create({
          data: {
            chatThreadId: chatThread.id,
            body: null,
            fileKey: filename
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




  private scheduleProcessing = (phoneWa: string) => {
    const existingTimer = debounceTimers.get(phoneWa)

    if (existingTimer) {
      clearTimeout(existingTimer)
    }



    const timer = setTimeout(() => {

      const userQuestionCore = new UserQuestionCoreUseCase(
        this.openAIService,
        this.chatThreadRepository,
        this.quoteRepository,
        this.customerRepository,
        this.messageService,
        this.fileRepository,
        this.fileStorageService
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

