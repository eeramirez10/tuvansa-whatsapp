import { CustomerDirectoryDetail, CustomerDirectoryScope } from '../../../domain/dtos/customers/customer-directory.dto'
import { CustomerRepository } from '../../../domain/repositories/customer.repository'

export class GetCustomerDirectoryDetailUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  execute(customerId: string, scope: CustomerDirectoryScope): Promise<CustomerDirectoryDetail | null> {
    return this.customerRepository.getDirectoryById(customerId, scope)
  }
}
