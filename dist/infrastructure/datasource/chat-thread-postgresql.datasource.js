"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatThreadPostgresqlDatasource = void 0;
const client_1 = require("@prisma/client");
const chat_thread_datasource_1 = require("../../domain/datasource/chat-thread.datasource");
const prismaClient = new client_1.PrismaClient();
class ChatThreadPostgresqlDatasource extends chat_thread_datasource_1.ChatThreadDatasource {
    getMessagesByThread(threadId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prismaClient.chatThread.findFirst({
                where: {
                    id: threadId
                },
                include: {
                    messages: {
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            });
        });
    }
    getThreads() {
        return __awaiter(this, void 0, void 0, function* () {
            return prismaClient.chatThread.findMany({
                orderBy: {
                    lastInteraction: {
                        sort: 'desc',
                        nulls: 'last'
                    }
                }
            });
        });
    }
    addCustomer(openAiThreadId, customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const customer = yield prismaClient.customer.findUnique({ where: { id: customerId } });
            if (!customer) {
                console.error('Cliente no encontrado:', customerId);
                throw new Error(`Cliente no existe con el id: ${customerId}`);
            }
            return yield prismaClient.chatThread.update({
                where: {
                    openAiThreadId
                },
                data: {
                    customerId: customerId
                }
            });
        });
    }
    getByThreadId(threadId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prismaClient.chatThread.findFirst({
                    where: {
                        openAiThreadId: threadId
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en ChatThread revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
    getThreadByPhone(_a) {
        return __awaiter(this, arguments, void 0, function* ({ phone }) {
            try {
                return yield prismaClient.chatThread.findFirst({
                    where: {
                        clientPhoneNumber: phone
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en ChatThread revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
    createThread(createThreadOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prismaClient.chatThread.create({
                    data: {
                        openAiThreadId: createThreadOptions.threadId,
                        clientPhoneNumber: createThreadOptions.clientPhoneNumber
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en ChatThread revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
    addMessage(addMessageOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.updateLastInteraction(addMessageOptions.chatThreadId);
                return yield prismaClient.message.create({
                    data: {
                        role: addMessageOptions.role,
                        content: addMessageOptions.content,
                        chatThreadId: addMessageOptions.chatThreadId
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en ChatThread revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
    updateLastInteraction(threadId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield prismaClient.chatThread.update({
                where: {
                    id: threadId
                },
                data: {
                    lastInteraction: new Date()
                }
            });
        });
    }
}
exports.ChatThreadPostgresqlDatasource = ChatThreadPostgresqlDatasource;
