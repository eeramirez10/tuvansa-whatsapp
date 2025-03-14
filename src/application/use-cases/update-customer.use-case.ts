import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { UpdateCustomerDto } from '../../domain/dtos/update-customer.dto';

export class UpdateCustomerUseCase {


  constructor(private readonly customerRepository: CustomerRepository) { }


  async execute(updateCustomerDto: UpdateCustomerDto) {

    return this.customerRepository.updateCustomer(updateCustomerDto)

  }


}