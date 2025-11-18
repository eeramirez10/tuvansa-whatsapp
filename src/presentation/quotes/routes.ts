import { Router } from "express";
import { QuotePostgresqlDatasource } from "../../infrastructure/datasource/quote-postgresql.datasource";
import { QuoteRepositoryImpl } from "../../infrastructure/repositories/quote.repository-impl";
import { QuotesController } from "./controller";
import { OpenAiFunctinsService } from "../../infrastructure/services/openai-functions.service";
import { QuoteVersionPostgresqlDatasource } from "../../infrastructure/datasource/quote-version-postgresql.datasource.dto";
import { QuoteVersionRepositoryImpl } from '../../infrastructure/repositories/quote-version.repository-impl';
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { S3FileStorageService } from "../../infrastructure/services/s3-file-storage.service";



export class QuotesRoutes {

  static routes(): Router {

    const router = Router()
    const datasource = new QuotePostgresqlDatasource()
    const quoteVersionDatasource = new QuoteVersionPostgresqlDatasource()
    const repositoty = new QuoteRepositoryImpl(datasource)
    const quoteVersionRepositoryImpl = new QuoteVersionRepositoryImpl(quoteVersionDatasource)



    const constroller = new QuotesController(
      repositoty,
      quoteVersionRepositoryImpl,
      new OpenAiFunctinsService(),
      new PrismaClient(),
      new S3FileStorageService()
    )

    router.get('/', constroller.getQuotes)
    router.get('/:id', constroller.getQuote)
    router.put('/item/:id', constroller.updateQuote)

    router.post('/:quoteId/versions/draft', AuthMiddleware.validateJWT, constroller.saveDraft)
    router.get('/:quoteId/display', AuthMiddleware.validateJWT, constroller.getDisplay)
    router.get('/:filekeyName/quote', constroller.getUploadedQuote)


    return router
  }
}