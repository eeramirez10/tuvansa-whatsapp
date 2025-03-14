import { CreateCustomerDto } from "../dtos/create-customer.dto";
import { UpdateCustomerDto } from "../dtos/update-customer.dto";
import { CustomerEntity } from "../entities/customer-entity";





export abstract class CustomerRepository {

  abstract createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity>

  abstract findByPhone(phoneNumber: string): Promise<CustomerEntity | null>

  abstract getById(customerId: string): Promise<CustomerEntity | null>
  abstract updateCustomer(updateCustometDto: UpdateCustomerDto): Promise<CustomerEntity>

  abstract getCustomerByQuoteNumber(quoteNumber: number): Promise<CustomerEntity | null>

}