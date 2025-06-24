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
exports.UserCuestionUseCase = void 0;
const save_customer_quote_use_case_1 = require("../save-customer-quote.use-case");
const send_mail_use_case_1 = require("../send-mail.use-case");
const save_tread_use_case_1 = require("./save-tread.use-case");
const update_customer_use_case_1 = require("../update-customer.use-case");
const save_history_chat_use_case_1 = require("../save-history-chat.use-case");
class UserCuestionUseCase {
    constructor(openaiService, chatThreadRepository, quoteRepository, customerRepository, emailService, fileStorageService) {
        this.openaiService = openaiService;
        this.chatThreadRepository = chatThreadRepository;
        this.quoteRepository = quoteRepository;
        this.customerRepository = customerRepository;
        this.emailService = emailService;
        this.fileStorageService = fileStorageService;
    }
    execute(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { phone, question } = options;
            const threadId = yield new save_tread_use_case_1.SaveThreadUseCase(this.openaiService, this.chatThreadRepository).execute({ phone });
            const message = yield this.openaiService.createMessage({ threadId, question });
            const run = yield this.openaiService.createRun({ threadId });
            let newCustomerQuote;
            while (true) {
                const runstatus = yield this.openaiService.checkStatus(threadId, run.id);
                if (runstatus.status === 'completed')
                    break;
                if (runstatus.status === 'requires_action') {
                    const requiredAction = (_a = runstatus.required_action) === null || _a === void 0 ? void 0 : _a.submit_tool_outputs.tool_calls;
                    if (!requiredAction)
                        break;
                    const saveCustomerQuote = new save_customer_quote_use_case_1.SaveCustomerQuoteUseCase(this.quoteRepository, this.customerRepository);
                    console.log({ requiredAction });
                    const tool_outputs = yield Promise.all(requiredAction.map((action) => __awaiter(this, void 0, void 0, function* () {
                        const functionName = action.function.name;
                        console.log({ functionName });
                        if (functionName === 'extract_customer_info') {
                            const clientInfo = JSON.parse(action.function.arguments);
                            console.log({ clientInfo });
                            const { customer_name, customer_lastname, email, phone, location, items = [], file_key } = clientInfo;
                            newCustomerQuote = yield saveCustomerQuote
                                .execute({
                                name: customer_name,
                                lastname: customer_lastname,
                                email,
                                phone,
                                location,
                                items,
                                fileKey: file_key
                            });
                            console.log({ newCustomerQuote });
                            console.log({ threadId });
                            yield this.chatThreadRepository.addCustomer(threadId, newCustomerQuote.customerId);
                            return {
                                tool_call_id: action.id,
                                output: `{success: true, msg:'Creado correctamente', quoteNumber:'${newCustomerQuote === null || newCustomerQuote === void 0 ? void 0 : newCustomerQuote.quoteNumber}' }`
                            };
                        }
                        if (functionName === 'update_customer_info') {
                            const clientInfo = JSON.parse(action.function.arguments);
                            const { customer_name, customer_lastname, email, phone, location } = clientInfo;
                            yield new update_customer_use_case_1.UpdateCustomerUseCase(this.customerRepository).execute({
                                name: customer_name,
                                lastname: customer_lastname,
                                email,
                                phone,
                                location,
                                id: ""
                            });
                            return {
                                tool_call_id: action.id,
                                output: "{success: true, msg:'Actualizado correctamente'}"
                            };
                        }
                        return { tool_call_id: action.id, output: "{success: true}" };
                    })));
                    yield this.openaiService.submitToolOutputs(runstatus.thread_id, runstatus.id, tool_outputs);
                    console.log((_b = tool_outputs[0]) === null || _b === void 0 ? void 0 : _b.output);
                }
                yield new Promise(resolve => setTimeout(resolve, 1000));
            }
            const messages = yield this.openaiService.getMessageList(threadId);
            const chatThread = yield this.chatThreadRepository.getByThreadId(threadId);
            if (chatThread === null || chatThread === void 0 ? void 0 : chatThread.id)
                yield new save_history_chat_use_case_1.SaveHistoryChatUseCase(this.chatThreadRepository).execute({ messages, threadId: chatThread === null || chatThread === void 0 ? void 0 : chatThread.id });
            if (newCustomerQuote) {
                let fileStream;
                if (newCustomerQuote.fileKey)
                    fileStream = yield this.fileStorageService.getFileStream(newCustomerQuote.fileKey);
                const customerQuote = yield this.quoteRepository.findByQuoteNumber({ quoteNumber: newCustomerQuote.quoteNumber });
                const htmlBody = this.emailService.generarBodyCorreo(customerQuote);
                new send_mail_use_case_1.SendMailUseCase(this.emailService)
                    .execute({
                    to: [
                        "eeramirez@tuvansa.com.mx",
                        "gbarranco@tuvansa.com.mx",
                        "mavalos@tuvansa.com.mx",
                        "rgrinberg@tuvansa.com.mx",
                        "lquintero@tuvansa.com.mx"
                    ],
                    subject: "Nueva cotización asistente IA  desde WhatsApp Tuvansa ",
                    htmlBody: htmlBody,
                    attachments: fileStream ? [
                        {
                            filename: newCustomerQuote.fileKey,
                            content: fileStream.body
                        }
                    ] : null
                }).then(() => {
                    console.log('Correo enviado correctamente');
                }).catch((e) => {
                    console.log('[SendMailUseCase]', e);
                });
            }
            return messages;
        });
    }
}
exports.UserCuestionUseCase = UserCuestionUseCase;
