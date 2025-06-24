"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMessagesByThreadUseCase = void 0;
class GetMessagesByThreadUseCase {
    constructor(chatThreadRepository) {
        this.chatThreadRepository = chatThreadRepository;
    }
    execute(threadId) {
        return this.chatThreadRepository.getMessagesByThread(threadId);
    }
}
exports.GetMessagesByThreadUseCase = GetMessagesByThreadUseCase;
