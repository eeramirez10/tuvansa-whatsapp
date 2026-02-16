import { Router } from "express";
import { BranchController } from "./controller";
import { BranchPostgresqlDatasource } from "../../infrastructure/datasource/branch-postgresql.datasource";
import { BranchRepositoryImpl } from "../../infrastructure/repositories/branch.respository-impl";



export class BranchRoutes {


  static routes(): Router {
    const app = Router()

    const dataSource = new BranchPostgresqlDatasource()
    const repository = new BranchRepositoryImpl(dataSource)
    const controller = new BranchController(repository)


    app.post('/', controller.createBranch)
    app.get('/:id', controller.getBranch)
    app.get('/', controller.getBranchs)
    app.put('/:id/assign-manager/:managerId', controller.assingManager)

    return app
  }
}