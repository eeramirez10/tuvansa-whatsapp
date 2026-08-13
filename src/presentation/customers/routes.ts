import { Router } from "express";
import { CustomerController } from "./controller";
import { CustomerRepositoryImpl } from "../../infrastructure/repositories/customer.repository-impl";
import { CustomerPostgresqlDatasource } from "../../infrastructure/datasource/customer-postgresql.datasource";
import { AuthMiddleware } from '../middlewares/auth.middleware';


export class CustomerRoutes {


  static routes():Router {

    const app = Router()

    const dataSource = new  CustomerPostgresqlDatasource()
    const repository = new CustomerRepositoryImpl(dataSource)

    const customerController = new CustomerController(repository)

    app.get('/', AuthMiddleware.validateJWT, customerController.getCustomers)
    app.get('/:id', AuthMiddleware.validateJWT, customerController.getCustomer)



    return app

  }

}
