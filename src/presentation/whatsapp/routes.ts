import { Router } from "express";
import { WhatsAppController } from "./controller";
import { ChatThreadRepositoryImpl } from '../../infrastructure/repositories/chat-thread.repository-impl';
import { ChatThreadPostgresqlDatasource } from "../../infrastructure/datasource/chat-thread-postgresql.datasource";
import { QuotePostgresqlDatasource } from "../../infrastructure/datasource/quote-postgresql.datasource";
import { QuoteRepositoryImpl } from '../../infrastructure/repositories/quote.repository-impl';
import { CustomerPostgresqlDatasource } from "../../infrastructure/datasource/customer-postgresql.datasource";
import { CustomerRepositoryImpl } from '../../infrastructure/repositories/customer.repository-impl';
import { OpenAIService } from "../../infrastructure/services/openai.service";
import { EmailService } from "../../infrastructure/services/mail.service";
import { MessageService } from "../../domain/services/message.service";
import { TwilioService } from "../../infrastructure/services/twilio.service";



export class WhatsAppRoutes {



  static routes =():Router => {

    const router = Router()
    const chatThreadDataSource = new ChatThreadPostgresqlDatasource()
    const quoteDataSource = new QuotePostgresqlDatasource()
    const customerDatasource = new CustomerPostgresqlDatasource()
    const chatThreadRepositoryImpl = new ChatThreadRepositoryImpl(chatThreadDataSource)
    const quoteRepositoryImpl = new   QuoteRepositoryImpl(quoteDataSource)
    const customerRepositoryImpl = new   CustomerRepositoryImpl(customerDatasource)
    const openAiService = new OpenAIService()

    const whastAppController = new WhatsAppController(
      openAiService, 
      new EmailService(),
      chatThreadRepositoryImpl,
      quoteRepositoryImpl,
      customerRepositoryImpl,
      new TwilioService()
    )
    
    router.post('/incoming-messages', whastAppController.webhookIncomingMessages.bind(whastAppController))

    return router
    

  }

}