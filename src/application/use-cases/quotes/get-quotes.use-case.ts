import { QuoteRepository } from "../../../domain/repositories/quote.repository";


export class GetQuotesUseCase {

  constructor(private readonly quoteRepository: QuoteRepository){}

  execute(){

    return this.quoteRepository.getQuotes()

  }
}