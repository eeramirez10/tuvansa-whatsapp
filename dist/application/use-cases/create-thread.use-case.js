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
exports.CreateThreadUseCase = void 0;
class CreateThreadUseCase {
    constructor(options) {
        this.openAi = options.openAi;
        this.chatThreadRepository = options.chatThreadRepository;
    }
    execute(_a) {
        return __awaiter(this, arguments, void 0, function* ({ phone }) {
            const findNumberInDB = yield this.chatThreadRepository.getThreadByPhone({ phone });
            if (!(findNumberInDB === null || findNumberInDB === void 0 ? void 0 : findNumberInDB.id)) {
                const { id: threadId } = yield this.openAi.beta.threads.create();
                yield this.chatThreadRepository.createThread({
                    threadId,
                    clientPhoneNumber: phone
                });
                return threadId;
            }
            return findNumberInDB.openAiThreadId;
        });
    }
}
exports.CreateThreadUseCase = CreateThreadUseCase;
