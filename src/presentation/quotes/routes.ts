import { Router } from "express";
import { QuotePostgresqlDatasource } from "../../infrastructure/datasource/quote-postgresql.datasource";
import { QuoteRepositoryImpl } from "../../infrastructure/repositories/quote.repository-impl";
import { QuotesController } from "./controller";
import { OpenAiFunctinsService } from "../../infrastructure/services/openai-functions.service";

import { QuoteVersionRepositoryImpl } from '../../infrastructure/repositories/quote-version.repository-impl';
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { S3FileStorageService } from "../../infrastructure/services/s3-file-storage.service";
import { QuoteVersionPostgresqlDatasource } from "../../infrastructure/datasource/quote-version-postgresql.datasource.dto";
import { QuoteExtractionJobsService } from "../../infrastructure/services/quote-extraction-jobs.service";
import { UserPostgresqlDatasource } from "../../infrastructure/datasource/user-postgresql.datasource";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user-repository-impl";
import { TwilioService } from "../../infrastructure/services/twilio.service";



export class QuotesRoutes {

  static routes(): Router {

    const router = Router()
    const datasource = new QuotePostgresqlDatasource()
    const quoteVersionDatasource = new QuoteVersionPostgresqlDatasource()
    const repositoty = new QuoteRepositoryImpl(datasource)
    const quoteVersionRepositoryImpl = new QuoteVersionRepositoryImpl(quoteVersionDatasource)
    const userRepository = new UserRepositoryImpl(new UserPostgresqlDatasource())



    const constroller = new QuotesController(
      repositoty,
      quoteVersionRepositoryImpl,
      new OpenAiFunctinsService(),
      new PrismaClient(),
      new S3FileStorageService(),
      new QuoteExtractionJobsService(),
      userRepository,
      new TwilioService()
    )

    router.get('/', AuthMiddleware.validateJWT, constroller.getQuotes)
    router.get('/:id', AuthMiddleware.validateJWT, constroller.getQuote)
    router.delete('/:id', AuthMiddleware.validateJWT, constroller.deleteQuote)
    router.get('/:id/attachment-file', AuthMiddleware.validateJWT, constroller.getQuoteAttachmentFile)
    router.put('/item/:id', constroller.updateQuote)
    router.patch('/:id/workflow-status', AuthMiddleware.validateJWT, constroller.updateQuoteWorkflowStatus)
    router.post('/:id/process-file', AuthMiddleware.validateJWT, constroller.processQuoteFile)
    router.post('/:id/extraction-result', AuthMiddleware.validateJWT, constroller.saveQuoteExtractionResult)

    router.post('/:quoteId/versions/draft', AuthMiddleware.validateJWT, constroller.saveDraft)
    router.get('/:quoteId/display', AuthMiddleware.validateJWT, constroller.getDisplay)
    router.get('/:filekeyName/quote', constroller.getUploadedQuote)


    return router
  }
}
