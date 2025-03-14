import { CustomerRepository } from '../../domain/repositories/customer.repository';


export class GetCustomerByIdUseCase {

  constructor(private readonly customerRepository:CustomerRepository){}


  async execute(id:string){

    return await this.customerRepository.getById(id)

  }
}