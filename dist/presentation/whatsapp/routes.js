"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppRoutes = void 0;
const express_1 = require("express");
const controller_1 = require("./controller");
const chat_thread_repository_impl_1 = require("../../infrastructure/repositories/chat-thread.repository-impl");
const chat_thread_postgresql_datasource_1 = require("../../infrastructure/datasource/chat-thread-postgresql.datasource");
const quote_postgresql_datasource_1 = require("../../infrastructure/datasource/quote-postgresql.datasource");
const quote_repository_impl_1 = require("../../infrastructure/repositories/quote.repository-impl");
const customer_postgresql_datasource_1 = require("../../infrastructure/datasource/customer-postgresql.datasource");
const customer_repository_impl_1 = require("../../infrastructure/repositories/customer.repository-impl");
const openai_service_1 = require("../../infrastructure/services/openai.service");
const mail_service_1 = require("../../infrastructure/services/mail.service");
const twilio_service_1 = require("../../infrastructure/services/twilio.service");
const s3_file_storage_service_1 = require("../../infrastructure/services/s3-file-storage.service");
class WhatsAppRoutes {
}
exports.WhatsAppRoutes = WhatsAppRoutes;
WhatsAppRoutes.routes = () => {
    const router = (0, express_1.Router)();
    const chatThreadDataSource = new chat_thread_postgresql_datasource_1.ChatThreadPostgresqlDatasource();
    const quoteDataSource = new quote_postgresql_datasource_1.QuotePostgresqlDatasource();
    const customerDatasource = new customer_postgresql_datasource_1.CustomerPostgresqlDatasource();
    const chatThreadRepositoryImpl = new chat_thread_repository_impl_1.ChatThreadRepositoryImpl(chatThreadDataSource);
    const quoteRepositoryImpl = new quote_repository_impl_1.QuoteRepositoryImpl(quoteDataSource);
    const customerRepositoryImpl = new customer_repository_impl_1.CustomerRepositoryImpl(customerDatasource);
    const openAiService = new openai_service_1.OpenAIService();
    const s3FileStorageService = new s3_file_storage_service_1.S3FileStorageService();
    const whastAppController = new controller_1.WhatsAppController(openAiService, new mail_service_1.EmailService(), chatThreadRepositoryImpl, quoteRepositoryImpl, customerRepositoryImpl, new twilio_service_1.TwilioService(), s3FileStorageService);
    router.post('/incoming-messages', whastAppController.webhookIncomingMessages.bind(whastAppController));
    router.post('/send-email', whastAppController.sendEmail.bind(whastAppController));
    return router;
};
