import { CustomerRepository } from "../../../domain/repositories/customer.repository";


export class GetCustomerUseCase {

  constructor(private readonly customerRepository: CustomerRepository) { }

  execute(id: string) {

    return this.customerRepository.getById(id)

  }
}