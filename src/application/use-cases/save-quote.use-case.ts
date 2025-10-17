import { QuoteRepository } from '../../domain/repositories/quote.repository';


interface Options {
  customerId: string
  fileKey?: string
  threadId?:string
}

export class SaveQuoteUseCase {


  constructor(private readonly quoteRepository: QuoteRepository) { }


  async execute(options: Options) {
    const { customerId, fileKey, threadId } = options
    const newQuote = await this.quoteRepository.createQuote({ customerId, fileKey, threadId })

   return newQuote

  }

}