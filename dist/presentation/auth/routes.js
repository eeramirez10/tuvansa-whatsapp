"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const auth_postgresql_datasource_1 = require("../../infrastructure/datasource/auth-postgresql.datasource");
const controller_1 = require("./controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const auth_repository_impl_1 = require("../../infrastructure/repositories/auth.repository-impl");
class AuthRoutes {
    static routes() {
        const router = (0, express_1.Router)();
        const datasource = new auth_postgresql_datasource_1.AuthPostgresqlDatasource();
        const repository = new auth_repository_impl_1.AuthRepositoryImpl(datasource);
        const controller = new controller_1.AuthController(repository);
        router.post('/register', controller.registerUser);
        router.post('/login', controller.loginUser);
        router.get('/renew', auth_middleware_1.AuthMiddleware.validateJWT, controller.renewToken);
        router.get('/check-field', controller.checkField);
        return router;
    }
}
exports.AuthRoutes = AuthRoutes;
