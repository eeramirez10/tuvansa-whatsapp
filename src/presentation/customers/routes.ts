import { Router } from "express";
import { CustomerController } from "./controller";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customer.repository-impl";
import { CustomerPostgresqlDatasource } from "../../infrastructure/datasource/customer-postgresql.datasource";


export class CustomerRoutes {


  static routes():Router {

    const app = Router()

    const dataSource = new  CustomerPostgresqlDatasource()
    const repository = new CustomerRepositoryImpl(dataSource)

    const customerController = new CustomerController(repository)

    app.get('/', customerController.getCustomers )
    app.get('/:id', customerController.getCustomer)



    return app

  }

}