import { QuoteRepository } from "../../../domain/repositories/quote.repository";

export class GetQuoteById {

  constructor(private readonly quoteRepository: QuoteRepository) { }

  execute(id: string) {
    return this.quoteRepository.getQuote(id)
  }
}