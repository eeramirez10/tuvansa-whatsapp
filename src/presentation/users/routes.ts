import { Router } from "express";
import { UserRepositoryImpl } from "../../infrastructure/repositories/user-repository-impl";
import { UserPostgresqlDatasource } from "../../infrastructure/datasource/user-postgresql.datasource";
import { TwilioService } from "../../infrastructure/services/twilio.service";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { UsersController } from "./controller";


export class UsersRoutes {

  static routes(): Router {
    const router = Router()

    const usersRepository = new UserRepositoryImpl(new UserPostgresqlDatasource())

    const {
      getAll,
      update,
      getNotificationSettings,
      upsertNotificationSetting,
      sendNotificationTest,
      sendNotificationTests
    } = new UsersController(usersRepository, new TwilioService())

    router.get('/', getAll);
    router.get('/notification-settings', AuthMiddleware.validateJWT, getNotificationSettings);
    router.put('/notification-settings', AuthMiddleware.validateJWT, upsertNotificationSetting);
    router.post('/notification-settings/test', AuthMiddleware.validateJWT, sendNotificationTest);
    router.post('/notification-settings/test-all', AuthMiddleware.validateJWT, sendNotificationTests);
    router.put('/:id', AuthMiddleware.validateJWT, update);

    return router
  }
}
