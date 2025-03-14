import { QuoteRepository } from '../../domain/repositories/quote.repository';


interface Options {

  description: string
  ean: string
  codigo: string
  price: number
  cost: number
  quoteId: string
  quantity: number;
  um: string;


}

export class AddQuoteItemsUseCase {

  constructor(private readonly quoteRepository: QuoteRepository) { }

  async execute(options: Options) {

    const { description, ean, codigo, price, cost, quoteId, quantity, um } = options

    return this.quoteRepository.addQuoteItems({
      description,
      ean,
      codigo,
      price,
      cost,
      quoteId,
      quantity,
      um
    })

  }
}