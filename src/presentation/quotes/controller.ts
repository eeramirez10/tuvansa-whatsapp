import { NextFunction, Request, Response } from 'express';
import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { GetQuotesUseCase } from '../../application/use-cases/quotes/get-quotes.use-case';
import { GetQuoteById } from '../../application/use-cases/quotes/get-quote-by-id.use-case';
import { GetTodoDto } from '../../domain/dtos/quotes/get-todo.dto';


export class QuotesController {

  constructor(private readonly quoteRepository: QuoteRepository) { }


  getQuotes = (req: Request, res: Response, next: NextFunction) => {


    new GetQuotesUseCase(this.quoteRepository)
      .execute()
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
}