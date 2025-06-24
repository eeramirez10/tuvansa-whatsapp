"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatThreadRepositoryImpl = void 0;
const chat_thread_repository_1 = require("../../domain/repositories/chat-thread.repository");
class ChatThreadRepositoryImpl extends chat_thread_repository_1.ChatThreadRepository {
    getMessagesByThread(threadId) {
        return this.chatThreadDatasource.getMessagesByThread(threadId);
    }
    constructor(chatThreadDatasource) {
        super();
        this.chatThreadDatasource = chatThreadDatasource;
    }
    getThreads() {
        return this.chatThreadDatasource.getThreads();
    }
    addCustomer(openAiThreadId, customerId) {
        return this.chatThreadDatasource.addCustomer(openAiThreadId, customerId);
    }
    getByThreadId(threadId) {
        return this.chatThreadDatasource.getByThreadId(threadId);
    }
    getThreadByPhone({ phone }) {
        return this.chatThreadDatasource.getThreadByPhone({ phone });
    }
    createThread(createThreadDto) {
        return this.chatThreadDatasource.createThread(createThreadDto);
    }
    addMessage(addMessageDto) {
        return this.chatThreadDatasource.addMessage(addMessageDto);
    }
}
exports.ChatThreadRepositoryImpl = ChatThreadRepositoryImpl;
