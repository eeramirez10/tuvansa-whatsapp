"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchRoutes = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const branch_postgresql_datasource_1 = require("../../infrastructure/datasource/branch-postgresql.datasource");
const branch_respository_impl_1 = require("../../infrastructure/repositories/branch.respository-impl");
class BranchRoutes {
    static routes() {
        const app = (0, express_1.Router)();
        const dataSource = new branch_postgresql_datasource_1.BranchPostgresqlDatasource();
        const repository = new branch_respository_impl_1.BranchRepositoryImpl(dataSource);
        const controller = new controller_1.BranchController(repository);
        app.post('/', controller.createBranch);
        app.get('/:id', controller.getBranch);
        app.get('/', controller.getBranchs);
        return app;
    }
}
exports.BranchRoutes = BranchRoutes;
