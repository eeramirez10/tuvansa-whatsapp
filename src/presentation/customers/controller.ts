import { Request, Response } from "express";
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { GetCustomersUseCase } from "../../application/use-cases/customers/get-customers.use-case";
import { GetCustomerUseCase } from "../../application/use-cases/customers/get-customer.use-case";
import { GetCustomerDto } from "../../domain/dtos/quotes/get-customer.dto";



export class CustomerController {

  constructor(private readonly customerRepository: CustomerRepository) { }


  getCustomers = async (req: Request, res: Response) => {

    new GetCustomersUseCase(this.customerRepository)
      .execute()
      .then((customers) => {
        res.json(customers)
      })
      .catch((e) => {
        console.log(e)
        res
          .status(500)
          .json({
            error: 'Hubo un error'
          })
      })

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




    new GetCustomerUseCase(this.customerRepository)
      .execute(id)
      .then((customer) => {
        res.json(customer)
      })
      .catch((e) => {
        console.log(e)
        res
          .status(500)
          .json({
            error: 'Hubo un error'
          })
      })

  }


}