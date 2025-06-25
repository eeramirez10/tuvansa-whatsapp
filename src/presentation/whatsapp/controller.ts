import { Request, Response } from "express";
import { EmailService } from '../../infrastructure/services/mail.service';
import { ChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import { QuoteRepository } from "../../domain/repositories/quote.repository";
import { CustomerRepository } from "../../domain/repositories/customer.repository";
import { UserCuestionUseCase } from "../../application/use-cases/whatsApp/user-question.use-case";
import { MessageService } from '../../domain/services/message.service';
import { LanguageModelService } from "../../domain/services/language-model.service";


import extname from 'ext-name'
import path from "path";
import url from "url";
import { FileStorageService } from '../../domain/services/file-storage.service';
import { SaveMediaFileUseCase } from "../../application/use-cases/file-storage/save-media-file.use-case";


enum Message {
  document,
  text
}

const ACCEPTED_FORMATS = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/pdf']


export class WhatsAppController {

  constructor(
    private openAIService: LanguageModelService,
    private emailService: EmailService,
    private chatThreadRepository: ChatThreadRepository,
    private quoteRepository: QuoteRepository,
    private customerRepository: CustomerRepository,
    private messageService: MessageService,
    private fileStorageService: FileStorageService

  ) {


  }

  async webhookIncomingMessages(req: Request, res: Response) {

    const payload = req.body

    const {
      MediaContentType0,
      SmsMessageSid,
      NumMedia,
      ProfileName,
      MessageType,
      SmsSid,
      WaId,
      SmsStatus,
      Body,
      To,
      NumSegments,
      ReferralNumMedia,
      MessageSid,
      AccountSid,
      From,
      MediaUrl0,
      ApiVersion,
    } = payload;

    console.log(payload)

    try {

      if (MessageType === 'text') {

        await new UserCuestionUseCase(
          this.openAIService,
          this.chatThreadRepository,
          this.quoteRepository,
          this.customerRepository,
          this.emailService,
          this.fileStorageService,
          this.messageService
        ).execute({ phone: WaId, question: Body })

        // const asistantResponse = userQuestion!.filter(q => q.role === 'assistant')[0]

        // await this.messageService.createWhatsAppMessage({
        //   body: asistantResponse.content,
        //   to: WaId
        // })


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

        

        const file = await this.messageService.getFileFromUrl(mediaUrl)
        // await this.messageService.deleteFileFromApi({ MessageSid, mediaSid }) /// revisar

        await new SaveMediaFileUseCase(this.fileStorageService)
          .execute(file, filename)

        const messaggeUploadFile = `archivo_adjuntado\nfile_key:${filename})`

        await new UserCuestionUseCase(
          this.openAIService,
          this.chatThreadRepository,
          this.quoteRepository,
          this.customerRepository,
          this.emailService,
          this.fileStorageService,
          this.messageService
        ).execute({ phone: WaId, question: messaggeUploadFile })

        // const asistantResponse = userQuestion!.filter(q => q.role === 'assistant')[0]
        // await this.messageService.createWhatsAppMessage({
        //   body: asistantResponse.content,
        //   to: WaId
        // })





        return res.status(202).send('Accepted')

      }


      await this.messageService.createWhatsAppMessage({
        body: 'Por seguridad no puedo aceptar ese tipo de archivo, solo puedo aceptar pdf o excel',
        to: WaId
      })


      res.status(202).send('Accepted')


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




  // private deleteMediaItem(mediaItem) {
  //   const client = getTwilioClient();

  //   return client
  //     .api.accounts(twilioAccountSid)
  //     .messages(mediaItem.MessageSid)
  //     .media(mediaItem.mediaSid).remove();
  // }




}

