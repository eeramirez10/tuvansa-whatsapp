"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRoutes = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const customer_repository_impl_1 = require("../../infrastructure/repositories/customer.repository-impl");
const customer_postgresql_datasource_1 = require("../../infrastructure/datasource/customer-postgresql.datasource");
class CustomerRoutes {
    static routes() {
        const app = (0, express_1.Router)();
        const dataSource = new customer_postgresql_datasource_1.CustomerPostgresqlDatasource();
        const repository = new customer_repository_impl_1.CustomerRepositoryImpl(dataSource);
        const customerController = new controller_1.CustomerController(repository);
        app.get('/', customerController.getCustomers);
        app.get('/:id', customerController.getCustomer);
        return app;
    }
}
exports.CustomerRoutes = CustomerRoutes;
