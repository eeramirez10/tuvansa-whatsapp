import { Router } from "express";
import { ReportsPostgresqlDataSource } from "../../infrastructure/datasource/reports-postgresql.datasource";
import { ReportsRepositoryImpl } from "../../infrastructure/repositories/reports.repository-impl";
import { ReportsController } from "./controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";

export class ReportsRoutes {
  static readonly routes = (): Router => {
    const router = Router();

    const datasource = new ReportsPostgresqlDataSource();
    const repository = new ReportsRepositoryImpl(datasource);

    const {
      getQuotesByBranchReport,
      getQuotesByBranchStatus,
      getQuotesExecutiveReport
    } = new ReportsController(repository);

    router.get('/quotes/by-branch', AuthMiddleware.validateJWT, getQuotesByBranchReport);
    router.get('/quotes/by-branch-status', AuthMiddleware.validateJWT, getQuotesByBranchStatus);
    router.get('/quotes/executive-printable', AuthMiddleware.validateJWT, getQuotesExecutiveReport);

    return router;
  }
}
