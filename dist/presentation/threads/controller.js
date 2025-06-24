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
exports.ThreadsController = void 0;
const get_threads_use_case_1 = require("../../application/use-cases/threads/get-threads.use-case");
const get_messages_by_thread_use_case_1 = require("../../application/use-cases/threads/get-messages-by-thread.use-case");
class ThreadsController {
    constructor(chatThreadRepository) {
        this.chatThreadRepository = chatThreadRepository;
        this.getList = (req, res) => __awaiter(this, void 0, void 0, function* () {
            new get_threads_use_case_1.GetThreadsUseCase(this.chatThreadRepository)
                .execute()
                .then((data) => {
                res.json(data);
            })
                .catch((e) => {
                console.log(e);
                res.status(500).json({ error: 'Hubo un error' });
            });
        });
        this.getMessages = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const threadId = req.body.threadId;
            new get_messages_by_thread_use_case_1.GetMessagesByThreadUseCase(this.chatThreadRepository)
                .execute(threadId)
                .then((data) => {
                res.json(data);
            })
                .catch((e) => {
                console.log(e);
                res.status(500).json({ error: 'Hubo un error' });
            });
        });
    }
}
exports.ThreadsController = ThreadsController;
