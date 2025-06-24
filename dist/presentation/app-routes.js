"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRoutes = void 0;
const express_1 = require("express");
const routes_1 = require("./whatsapp/routes");
const routes_2 = require("./threads/routes");
const routes_3 = require("./customers/routes");
const routes_4 = require("./quotes/routes");
const routes_5 = require("./auth/routes");
const routes_6 = require("./branchs/routes");
class AppRoutes {
    constructor() { }
    static routes() {
        const routes = (0, express_1.Router)();
        routes.use('/api/auth', routes_5.AuthRoutes.routes());
        routes.use('/api/whatsapp', routes_1.WhatsAppRoutes.routes());
        routes.use('/api/threads', routes_2.ThreadsRoutes.routes());
        routes.use('/api/customers', routes_3.CustomerRoutes.routes());
        routes.use('/api/quotes', routes_4.QuotesRoutes.routes());
        routes.use('/api/branchs', routes_6.BranchRoutes.routes());
        return routes;
    }
}
exports.AppRoutes = AppRoutes;
