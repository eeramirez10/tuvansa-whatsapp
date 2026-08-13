import { CreateCustomerDto } from "../../domain/dtos/create-customer.dto";
import { CustomerRepository } from "../../domain/repositories/customer.repository";
import { CustomerDatasource } from '../../domain/datasource/customer.datasource';
import { CustomerEntity } from "../../domain/entities/customer-entity";
import { UpdateCustomerDto } from "../../domain/dtos/update-customer.dto";
import {
  CustomerDirectoryDetail,
  CustomerDirectoryPage,
  CustomerDirectoryScope,
  ListCustomersDirectoryDto
} from '../../domain/dtos/customers/customer-directory.dto';



export class CustomerRepositoryImpl extends CustomerRepository {



  constructor(private readonly customerDatasource: CustomerDatasource) {
    super();
  }


  updateCustomerByWhatsappNumber(whatsappNumber: string, updateCustometDto: UpdateCustomerDto): Promise<CustomerEntity> {
    return this.customerDatasource.updateCustomerByWhatsappNumber(whatsappNumber, updateCustometDto);
  }



  findByWhatsappPhone(phoneWa: string): Promise<CustomerEntity> {
    return this.customerDatasource.findByWhatsappPhone(phoneWa)
  }


  getCustomers(): Promise<CustomerEntity[]> {
    return this.customerDatasource.getCustomers()
  }

  getDirectory(
    dto: ListCustomersDirectoryDto,
    scope: CustomerDirectoryScope
  ): Promise<CustomerDirectoryPage> {
    return this.customerDatasource.getDirectory(dto, scope)
  }

  getDirectoryById(
    customerId: string,
    scope: CustomerDirectoryScope
  ): Promise<CustomerDirectoryDetail | null> {
    return this.customerDatasource.getDirectoryById(customerId, scope)
  }

  getCustomerByQuoteNumber(quoteNumber: number): Promise<CustomerEntity | null> {
    return this.customerDatasource.getCustomerByQuoteNumber(quoteNumber)
  }

  getById(customerId: string): Promise<CustomerEntity | null> {
    return this.customerDatasource.getById(customerId)
  }

  updateCustomer(updateCustometDto: UpdateCustomerDto): Promise<CustomerEntity> {
    return this.customerDatasource.updateCustomer(updateCustometDto)
  }


  findByPhone(phoneNumber: string): Promise<CustomerEntity | null> {
    return this.customerDatasource.findByPhone(phoneNumber)
  }

  createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity> {
    return this.customerDatasource.createCustomer(createCustomerDto)
  }


}
