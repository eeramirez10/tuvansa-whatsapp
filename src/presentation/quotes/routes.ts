import { Router } from "express";
import { QuotePostgresqlDatasource } from "../../infrastructure/datasource/quote-postgresql.datasource";
import { QuoteRepositoryImpl } from "../../infrastructure/repositories/quote.repository-impl";
import { QuotesController } from "./controller";
import { OpenAiFunctinsService } from "../../infrastructure/services/openai-functions.service";



export class QuotesRoutes {

  static routes(): Router {

    const router = Router()
    const datasource = new QuotePostgresqlDatasource()
    const repositoty = new QuoteRepositoryImpl(datasource)

    const constroller = new QuotesController(repositoty,new OpenAiFunctinsService())

    router.get('/', constroller.getQuotes)
    router.get('/:id', constroller.getQuote)
    router.put('/item/:id', constroller.updateQuote)

    return router
  }
}