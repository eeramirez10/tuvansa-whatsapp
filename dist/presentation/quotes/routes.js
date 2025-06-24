"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotesRoutes = void 0;
const express_1 = require("express");
const quote_postgresql_datasource_1 = require("../../infrastructure/datasource/quote-postgresql.datasource");
const quote_repository_impl_1 = require("../../infrastructure/repositories/quote.repository-impl");
const controller_1 = require("./controller");
class QuotesRoutes {
    static routes() {
        const router = (0, express_1.Router)();
        const datasource = new quote_postgresql_datasource_1.QuotePostgresqlDatasource();
        const repositoty = new quote_repository_impl_1.QuoteRepositoryImpl(datasource);
        const constroller = new controller_1.QuotesController(repositoty);
        router.get('/', constroller.getQuotes);
        router.get('/:id', constroller.getQuote);
        router.put('/item/:id', constroller.updateQuote);
        return router;
    }
}
exports.QuotesRoutes = QuotesRoutes;
