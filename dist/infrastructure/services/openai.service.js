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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const envs_1 = require("../../config/envs");
const openai_config_1 = require("../../config/openai-config");
class OpenAIService {
    constructor() {
        this.openai = new openai_1.default({ apiKey: envs_1.envs.OPEN_API_KEY });
    }
    // async createThread({ phone }: { phone: string }) {
    //   const createThread = new createThreadUseCase({
    //     openAi: this.openai,
    //     chatThreadRepository: this.chatThreadRepository
    //   })
    //     .execute({ phone })
    //   return await createThread
    // }
    createThread() {
        return __awaiter(this, void 0, void 0, function* () {
            const { id: threadId } = yield this.openai.beta.threads.create();
            return threadId;
        });
    }
    createMessage(_a) {
        return __awaiter(this, arguments, void 0, function* ({ threadId, question }) {
            const message = yield openai_config_1.openai.beta.threads.messages.create(threadId, {
                role: 'user',
                content: question
            });
            return message;
        });
    }
    createRun(_a) {
        return __awaiter(this, arguments, void 0, function* ({ threadId, assistantId = 'asst_zH28urJes1YILRhYUZrjjakE' }) {
            const run = yield openai_config_1.openai.beta.threads.runs.create(threadId, { assistant_id: assistantId });
            return run;
        });
    }
    // async userQuestion(questionDto: QuestionDto) {
    //   const { threadId, question } = questionDto
    //   const message = await createMessageUseCase(this.openai, { threadId, question })
    //   const run = await createRunUseCase(this.openai, { threadId });
    //   await new CheckCompleteStatusUseCase(openai, this.quoteRepository, this.customerRepository, emailService).execute({ runId: run.id, threadId })
    //   const messages = await getMessageListUseCase(this.openai, { threadId })
    //   const chatThread = await this.chatThreadRepository.getByThreadId(threadId)
    //   if (chatThread?.id) await new SaveHistoryChatUseCase(this.chatThreadRepository).execute({ messages, threadId: chatThread?.id })
    //   return messages
    // }
    checkStatus(threadId, runId) {
        return __awaiter(this, void 0, void 0, function* () {
            const runStatus = yield this.openai.beta.threads.runs.retrieve(threadId, runId);
            console.log({ status: runStatus.status });
            return runStatus;
        });
    }
    submitToolOutputs(threadId, runId, toolOutputs) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs: toolOutputs });
        });
    }
    getMessageList(threadId) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageList = yield this.openai.beta.threads.messages.list(threadId);
            const messages = messageList.data.map(message => ({
                role: message.role,
                content: message.content.map(content => content.text.value)
            }));
            return messages;
        });
    }
}
exports.OpenAIService = OpenAIService;
