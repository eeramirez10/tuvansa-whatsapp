import { QuoteRepository } from '../../domain/repositories/quote.repository';


interface Options {
  customerId: string
}

export class SaveQuoteUseCase {


  constructor(private readonly quoteRepository: QuoteRepository) { }


  async execute(options: Options) {
    const { customerId } = options
    const newQuote = await this.quoteRepository.createQuote({ customerId })

   return newQuote

  }

}