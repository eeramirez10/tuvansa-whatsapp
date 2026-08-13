import { ListCustomersDirectoryDto, CustomerDirectoryPage, CustomerDirectoryScope } from '../../../domain/dtos/customers/customer-directory.dto'
import { CustomerRepository } from '../../../domain/repositories/customer.repository'

export class GetCustomerDirectoryUseCase {
  constructor(private readonly customerRepository: CustomerRepository) {}

  execute(dto: ListCustomersDirectoryDto, scope: CustomerDirectoryScope): Promise<CustomerDirectoryPage> {
    return this.customerRepository.getDirectory(dto, scope)
  }
}
