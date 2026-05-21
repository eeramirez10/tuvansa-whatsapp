import { Request, Router, Response } from "express"
import { WhatsAppRoutes } from "./whatsapp/routes"
import { ThreadsRoutes } from './threads/routes';
import { CustomerRoutes } from "./customers/routes";
import { QuotesRoutes } from "./quotes/routes";
import { AuthRoutes } from './auth/routes';
import { BranchRoutes } from "./branchs/routes";
import { QuotesVersionRoutes } from "./quote-version/routes";
import { UsersRoutes } from "./users/routes";
import { ReportsRoutes } from "./reports/routes";


export class AppRoutes {



  static routes(): Router {
    const routes = Router()

    routes.use('/api/auth', AuthRoutes.routes())
    routes.use('/api/whatsapp', WhatsAppRoutes.routes())
    routes.use('/api/threads', ThreadsRoutes.routes())
    routes.use('/api/customers', CustomerRoutes.routes())
    routes.use('/api/quotes', QuotesRoutes.routes())
    routes.use('/api/branchs', BranchRoutes.routes())
    routes.use('/api/quote-versions', QuotesVersionRoutes.routes())
    routes.use('/api/users', UsersRoutes.routes())
    routes.get('/api/health', (req: Request, res: Response) => {
      return res.json(
        { ok: true, service: "tuvansa-whatsapp-backend", date: new Date().toISOString() }
      )
    })

    routes.use('/api/reports/', ReportsRoutes.routes())

    return routes
  }
}