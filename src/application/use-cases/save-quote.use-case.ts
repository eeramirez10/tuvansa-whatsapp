import { QuoteRepository } from '../../domain/repositories/quote.repository';


interface Options {
  customerId: string
  fileKey?: string
}

export class SaveQuoteUseCase {


  constructor(private readonly quoteRepository: QuoteRepository) { }


  async execute(options: Options) {
    const { customerId, fileKey } = options
    const newQuote = await this.quoteRepository.createQuote({ customerId, fileKey })

   return newQuote

  }

}