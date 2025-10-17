import { NextFunction, Request, Response } from 'express';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { GetQuotesUseCase } from '../../application/use-cases/quotes/get-quotes.use-case';
import { GetQuoteById } from '../../application/use-cases/quotes/get-quote-by-id.use-case';
import { GetTodoDto } from '../../domain/dtos/quotes/get-todo.dto';
import { UpdateQuoteItemDto } from '../../domain/dtos/quotes/update-quote-item.dto';
import { UpdateQuoteItemUseCase } from '../../application/use-cases/quotes/update-quote-item.use-case';
import { GetQuotesDto } from '../../domain/dtos/quotes/get-quotes.dto';
import { OpenAIService } from '../../infrastructure/services/openai.service';
import { OpenAiFunctinsService } from '../../infrastructure/services/openai-functions.service';


export class QuotesController {

  constructor(private readonly quoteRepository: QuoteRepository, private readonly openAIService:OpenAiFunctinsService) { }


  getQuotes = (req: Request, res: Response, next: NextFunction) => {


    const [error, getQuotesDto] = GetQuotesDto.execute({ ...req.query })

   
    if (error) {
      res.status(400).json({ error })
      return
    }

    new GetQuotesUseCase(this.quoteRepository, this.openAIService)
      .execute(getQuotesDto)
      .then((quotes) => {

        res.json(quotes)
      })
      .catch((e) => {
        console.log(e)
        res.status(500).json({ error: 'Hubo un error' })
      })

  }


  getQuote = (req: Request, res: Response, next: NextFunction) => {

    const id = req.params.id as string

    const [error] = GetTodoDto.execute({ id })

    if (error) {

      res
        .status(400)
        .json({ error })
      return
    }

    new GetQuoteById(this.quoteRepository)
      .execute(id)
      .then((quote) => {

        res
          .json(quote)
      })
      .catch((e) => {
        console.log(e)
        res
          .status(500)
          .json({ error: 'Hubo un error' })
      })

  }


  updateQuote = (req: Request, res: Response) => {

    const id = req.params.id

    const [error, dto] = UpdateQuoteItemDto.execute(req.body)

    if (error) {
      res.status(401).json({ error })
      return
    }

    new UpdateQuoteItemUseCase(this.quoteRepository)
      .execute(id, dto)
      .then((data) => {
        res.json(data)
      })
      .catch((e) => {
        console.log(e)
        res
          .status(500)
          .json({ error: 'Hubo un error' })
      })

  }
}