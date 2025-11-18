import { CustomerRepository } from '../../domain/repositories/customer.repository';


export interface Options {
  name: string
  lastname: string
  email: string
  phone: string
  phoneWa: string
  location: string

}

export class CreateCustomerUseCase {

  constructor(private readonly customerRepository: CustomerRepository) { }

  async execute(options: Options) {

    const findByPhone = await this.customerRepository.findByPhone(options.phone)

    if (findByPhone) return findByPhone

    return await this.customerRepository.createCustomer(options)

  }
}