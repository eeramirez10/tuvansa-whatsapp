import { Router } from "express"
import { WhatsAppRoutes } from "./whatsapp/routes"
import { ThreadsRoutes } from './threads/routes';
import { CustomerRoutes } from "./customers/routes";
import { QuotesRoutes } from "./quotes/routes";
import { AuthRoutes } from './auth/routes';
import { BranchRoutes } from "./branchs/routes";


export class AppRoutes {

  constructor(){}

  static routes(): Router{
    const routes = Router()

    routes.use('/api/auth', AuthRoutes.routes())
    routes.use('/api/whatsapp', WhatsAppRoutes.routes())
    routes.use('/api/threads', ThreadsRoutes.routes())
    routes.use('/api/customers', CustomerRoutes.routes())
    routes.use('/api/quotes', QuotesRoutes.routes())
    routes.use('/api/branchs', BranchRoutes.routes())

    return routes
  }
}