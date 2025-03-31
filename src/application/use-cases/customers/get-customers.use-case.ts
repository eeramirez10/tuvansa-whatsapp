import { CustomerRepository } from '../../../domain/repositories/customer.repository';


export class GetCustomersUseCase {

  constructor(private readonly customerRepository: CustomerRepository ){}


  async execute() {

    return await this.customerRepository.getCustomers()
  }
}