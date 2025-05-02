import { QuoteRepository } from '../../domain/repositories/quote.repository';
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { CreateCustomerUseCase } from './create-customer.use-case';
import { SaveQuoteUseCase } from './save-quote.use-case';
import { Item } from '../../domain/interfaces/quotation';
import { AddQuoteItemsUseCase } from './add-quote-items.use-case';



interface Options {
  name: string
  lastname: string
  email: string
  phone: string
  location: string
  items: Item[]
  fileKey?: string
}


export class SaveCustomerQuoteUseCase {

  constructor(private readonly quoteRepository: QuoteRepository, private readonly customerRepository: CustomerRepository) { }

  async execute(options: Options) {

    const {
      name,
      lastname,
      email,
      phone,
      location,
      items = [],
      fileKey
      
    } = options

    const createCustomer = await new CreateCustomerUseCase(this.customerRepository).execute({
      name,
      lastname,
      email,
      phone,
      location,
    })

    const newQuote = await new SaveQuoteUseCase(this.quoteRepository).execute({ customerId: createCustomer.id, fileKey })

    

    for (let item of items) {

      if(items.length === 0) break

      const addItems = await new AddQuoteItemsUseCase(this.quoteRepository).execute({
        price: 0,
        cost: 0,
        quoteId: newQuote.id,
        ...item
      })

    }



    return this.quoteRepository.findByQuoteNumber({ quoteNumber: newQuote.quoteNumber })

  }
}