import { Router } from "express";
import { AuthPostgresqlDatasource } from "../../infrastructure/datasource/auth-postgresql.datasource";

import { AuthController } from "./controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AuthRepositoryImpl } from "../../infrastructure/repositories/auth.repository-impl";


export class AuthRoutes {

  static routes():Router {

    const router = Router()

    const datasource = new AuthPostgresqlDatasource()
    const repository = new AuthRepositoryImpl (datasource)

    const controller = new AuthController(repository)

    router.post('/register', controller.registerUser)

    router.post('/login', controller.loginUser)

    router.get('/renew',AuthMiddleware.validateJWT, controller.renewToken)

    router.get('/check-field', controller.checkField)
    


    return router
  }
}