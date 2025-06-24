"use strict";
// chat-thread.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatThreadEntity = void 0;
class ChatThreadEntity {
    constructor(options) {
        this.id = options.id;
        this.openAiThreadId = options.openAiThreadId;
        this.clientPhoneNumber = options.clientPhoneNumber;
        this.status = options.status;
        this.createdAt = options.createdAt;
        this.lastInteraction = options.lastInteraction;
        this.location = options.location;
        this.customerId = options.customerId;
    }
}
exports.ChatThreadEntity = ChatThreadEntity;
