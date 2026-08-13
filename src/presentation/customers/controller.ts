import { Request, Response } from "express";
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { GetCustomerDto } from "../../domain/dtos/quotes/get-customer.dto";
import { ListCustomersDirectoryDto } from '../../domain/dtos/customers/customer-directory.dto';
import { GetCustomerDirectoryUseCase } from '../../application/use-cases/customers/get-customer-directory.use-case';
import { GetCustomerDirectoryDetailUseCase } from '../../application/use-cases/customers/get-customer-directory-detail.use-case';
import { getCustomerDirectoryScope } from './customer-access';



export class CustomerController {

  constructor(private readonly customerRepository: CustomerRepository) { }


  getCustomers = async (req: Request, res: Response) => {
    const [error, dto] = ListCustomersDirectoryDto.execute(req.query)
    if (error || !dto) {
      res.status(400).json({ error })
      return
    }

    try {
      const result = await new GetCustomerDirectoryUseCase(this.customerRepository)
        .execute(dto, getCustomerDirectoryScope(req.body.user))
      res.json(result)
    } catch (e) {
      console.log(e)
      res.status(500).json({ error: 'Hubo un error al consultar los clientes' })
    }

  }

  getCustomer = async (req: Request, res: Response) => {

    const id = req.params.id as string

    const [error] = GetCustomerDto.execute({ id })

    if (error) {

      res
        .status(400)
        .json({ error })
      return
    }




    try {
      const customer = await new GetCustomerDirectoryDetailUseCase(this.customerRepository)
        .execute(id, getCustomerDirectoryScope(req.body.user))

      if (!customer) {
        res.status(404).json({ error: 'Cliente no encontrado' })
        return
      }

      res.json(customer)
    } catch (e) {
      console.log(e)
      res.status(500).json({ error: 'Hubo un error al consultar el cliente' })
    }

  }

}
