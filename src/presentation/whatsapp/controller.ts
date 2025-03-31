import { Request, Response } from "express";
import { EmailService } from '../../infrastructure/services/mail.service';
import { ChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import { QuoteRepository } from "../../domain/repositories/quote.repository";
import { CustomerRepository } from "../../domain/repositories/customer.repository";
import { UserCuestionUseCase } from "../../application/use-cases/whatsApp/user-question.use-case";
import { MessageService } from '../../domain/services/message.service';
import { LanguageModelService } from "../../domain/services/language-model.service";



export class WhatsAppController {

  constructor(
    private openAIService: LanguageModelService,
    private emailService: EmailService,
    private chatThreadRepository: ChatThreadRepository,
    private quoteRepository: QuoteRepository,
    private customerRepository: CustomerRepository,
    private messageService: MessageService

  ) {


  }

  async webhookIncomingMessages(req: Request, res: Response) {

    const payload = req.body

    const {

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
      ApiVersion,
    } = payload;

    console.log(payload)

    try {

      const userQuestion = await new UserCuestionUseCase(
        this.openAIService,
        this.chatThreadRepository,
        this.quoteRepository,
        this.customerRepository,
        this.emailService
      ).execute({ phone: WaId, question: Body })

      const asistantResponse = userQuestion!.filter(q => q.role === 'assistant')[0]

      await this.messageService.createWhatsAppMessage({
        body: asistantResponse.content,
        to: WaId
      })


      res.status(202).send('Accepted')



    } catch (error) {
      console.log(error)

      res.status(500).json({ error: 'Ocurrio un error' })
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




}

