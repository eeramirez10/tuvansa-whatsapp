import { Router } from "express";
import { ThreadsController } from "./controller";
import { ChatThreadPostgresqlDatasource } from "../../infrastructure/datasource/chat-thread-postgresql.datasource";
import { ChatThreadRepositoryImpl } from '../../infrastructure/repositories/chat-thread.repository-impl';


export class ThreadsRoutes {


  static routes(): Router {

    const router = Router()

    const threadsDatasource = new ChatThreadPostgresqlDatasource()
    const chatThreadRepositoryImpl = new ChatThreadRepositoryImpl(threadsDatasource)
    const threadsController = new ThreadsController(chatThreadRepositoryImpl)

    router.get('/', threadsController.getList)
    router.post('/messages', threadsController.getMessages)


    return router
  }

}