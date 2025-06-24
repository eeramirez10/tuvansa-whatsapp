"use strict";
// message.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageEntity = void 0;
class MessageEntity {
    constructor(options) {
        this.id = options.id;
        this.role = options.role;
        this.content = options.content;
        this.createdAt = options.createdAt;
        this.chatThreadId = options.chatThreadId;
    }
}
exports.MessageEntity = MessageEntity;
