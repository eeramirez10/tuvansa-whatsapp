import { Router } from "express";
import { QuoteVersionRepositoryImpl } from '../../infrastructure/repositories/quote-version.repository-impl';
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { QuoteVersionsController } from "./controller";
import { QuoteVersionPostgresqlDatasource } from "../../infrastructure/datasource/quote-version-postgresql.datasource.dto";



export class QuotesVersionRoutes {

  static routes(): Router {

    const router = Router()

    const quoteVersionDatasource = new QuoteVersionPostgresqlDatasource()
    const quoteVersionRepositoryImpl = new QuoteVersionRepositoryImpl(quoteVersionDatasource);

    const controller = new QuoteVersionsController(
      quoteVersionRepositoryImpl
    )


    router.post('/:id/concluide', AuthMiddleware.validateJWT, controller.concluideQuoteVersion);
    router.get('/:quoteId/draft', controller.getDraftByQuote);


    return router
  }
}
