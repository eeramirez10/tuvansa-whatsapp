import { Router } from "express"
import { WhatsAppRoutes } from "./whatsapp/routes"


export class AppRoutes {

  constructor(){}

  static routes(): Router{
    const routes = Router()

    routes.use('/api/whatsapp', WhatsAppRoutes.routes())

    return routes
  }
}