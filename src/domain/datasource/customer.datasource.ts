import { CreateCustomerDto } from "../dtos/create-customer.dto";
import { CustomerEntity } from "../entities/customer-entity";
import { UpdateCustomerDto } from '../dtos/update-customer.dto';
import {
  CustomerDirectoryDetail,
  CustomerDirectoryPage,
  CustomerDirectoryScope,
  ListCustomersDirectoryDto
} from '../dtos/customers/customer-directory.dto';





export abstract class CustomerDatasource {

  abstract createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity>

  abstract findByPhone(phoneNumber: string): Promise<CustomerEntity | null>

  abstract updateCustomer(updateCustometDto: UpdateCustomerDto): Promise<CustomerEntity>

  abstract updateCustomerByWhatsappNumber(whatsappNumber: string, updateCustometDto: UpdateCustomerDto): Promise<CustomerEntity>

  abstract getById(customerId: string): Promise<CustomerEntity | null>

  abstract getCustomerByQuoteNumber(quoteNumber: number,): Promise<CustomerEntity | null>

  abstract getCustomers(): Promise<CustomerEntity[]>

  abstract getDirectory(
    dto: ListCustomersDirectoryDto,
    scope: CustomerDirectoryScope
  ): Promise<CustomerDirectoryPage>

  abstract getDirectoryById(
    customerId: string,
    scope: CustomerDirectoryScope
  ): Promise<CustomerDirectoryDetail | null>

  abstract findByWhatsappPhone(phoneWa: string): Promise<CustomerEntity>
}
