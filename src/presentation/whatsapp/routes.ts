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
import { TwilioService } from "../../infrastructure/services/twilio.service";
import { S3FileStorageService } from '../../infrastructure/services/s3-file-storage.service';
import { FilePostgresqlDataSource } from "../../infrastructure/datasource/file-postgresql.datasource";
import { FileRepositoryImpl } from '../../infrastructure/repositories/file.repository-impl';
import { FileRepository } from '../../domain/repositories/file.repository';
import { BranchRepositoryImpl } from '../../infrastructure/repositories/branch.respository-impl';
import { BranchPostgresqlDatasource } from "../../infrastructure/datasource/branch-postgresql.datasource";
import { MessageRepositoryImpl } from "../../infrastructure/repositories/message.repository-impl";
import { MessagePostgresqlDatasource } from "../../infrastructure/datasource/message-postgresql.datasource";





export class WhatsAppRoutes {



  static routes = (): Router => {

    const router = Router()

    const chatThreadRepositoryImpl = new ChatThreadRepositoryImpl(new ChatThreadPostgresqlDatasource())
    const quoteRepositoryImpl = new QuoteRepositoryImpl(new QuotePostgresqlDatasource())
    const customerRepositoryImpl = new CustomerRepositoryImpl(new CustomerPostgresqlDatasource())
    const openAiService = new OpenAIService(new TwilioService())
    const s3FileStorageService = new S3FileStorageService()
    const fileRepositoryImpl = new FileRepositoryImpl(new FilePostgresqlDataSource());
    const branchRepository = new BranchRepositoryImpl(new BranchPostgresqlDatasource())
    const messageRepository = new MessageRepositoryImpl(new MessagePostgresqlDatasource())

    const whastAppController = new WhatsAppController(
      openAiService,
      new EmailService(),
      chatThreadRepositoryImpl,
      quoteRepositoryImpl,
      customerRepositoryImpl,
      new TwilioService(),
      s3FileStorageService,
      fileRepositoryImpl,
      branchRepository,
      messageRepository
    )

    router.post('/incoming-messages', whastAppController.webhookIncomingMessages.bind(whastAppController))

    router.post('/send-email', whastAppController.sendEmail.bind(whastAppController))
    router.post('/send-message', whastAppController.SendWhatsApp.bind(whastAppController))
    router.post('/send-template', whastAppController.sendWhatssAppTemplate.bind(whastAppController))


    return router


  }

}