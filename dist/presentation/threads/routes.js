"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadsRoutes = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const chat_thread_postgresql_datasource_1 = require("../../infrastructure/datasource/chat-thread-postgresql.datasource");
const chat_thread_repository_impl_1 = require("../../infrastructure/repositories/chat-thread.repository-impl");
class ThreadsRoutes {
    static routes() {
        const router = (0, express_1.Router)();
        const threadsDatasource = new chat_thread_postgresql_datasource_1.ChatThreadPostgresqlDatasource();
        const chatThreadRepositoryImpl = new chat_thread_repository_impl_1.ChatThreadRepositoryImpl(threadsDatasource);
        const threadsController = new controller_1.ThreadsController(chatThreadRepositoryImpl);
        router.get('/', threadsController.getList);
        router.post('/messages', threadsController.getMessages);
        return router;
    }
}
exports.ThreadsRoutes = ThreadsRoutes;
