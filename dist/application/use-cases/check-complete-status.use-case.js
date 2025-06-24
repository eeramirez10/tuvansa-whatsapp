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
exports.CheckCompleteStatusUseCase = void 0;
const save_customer_quote_use_case_1 = require("./save-customer-quote.use-case");
const update_customer_use_case_1 = require("./update-customer.use-case");
const send_mail_use_case_1 = require("./send-mail.use-case");
class CheckCompleteStatusUseCase {
    constructor(openai, quoteRepository, customerRepository, emailService) {
        this.openai = openai;
        this.quoteRepository = quoteRepository;
        this.customerRepository = customerRepository;
        this.emailService = emailService;
    }
    execute(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { threadId, runId } = options;
            const saveCustomerQuote = new save_customer_quote_use_case_1.SaveCustomerQuoteUseCase(this.quoteRepository, this.customerRepository);
            const runStatus = yield this.openai.beta.threads.runs.retrieve(threadId, runId);
            const status = runStatus.status;
            console.log({ status });
            const requiredAction = (_a = runStatus.required_action) === null || _a === void 0 ? void 0 : _a.submit_tool_outputs.tool_calls;
            if (status === 'requires_action') {
                const tool_outputs = yield Promise.all((_b = requiredAction.map((action) => __awaiter(this, void 0, void 0, function* () {
                    const functionName = action.function.name;
                    console.log({ functionName });
                    if (functionName === 'extract_customer_info') {
                        const clientInfo = JSON.parse(action.function.arguments);
                        console.log({ clientInfo });
                        console.log(clientInfo.items[0]);
                        const { customer_name, customer_lastname, email, phone, location, items, } = clientInfo;
                        const newCustomer = yield saveCustomerQuote.execute({
                            name: customer_name,
                            lastname: customer_lastname,
                            email,
                            phone,
                            location,
                            items
                        });
                        if (newCustomer === null || newCustomer === void 0 ? void 0 : newCustomer.quoteNumber) {
                            const getNewCustomerQuote = yield this.quoteRepository.findByQuoteNumber({ quoteNumber: newCustomer.quoteNumber });
                            if (getNewCustomerQuote) {
                                const htmlBody = this.emailService.generarBodyCorreo(getNewCustomerQuote);
                                new send_mail_use_case_1.SendMailUseCase(this.emailService).execute({
                                    to: ["eeramirez@tuvansa.com.mx", "gbarranco@tuvansa.com.mx", "lquintero@tuvansa.com.mx"],
                                    subject: "Hay una nueva cotizacion de WhatsApp Tuvansa  ",
                                    htmlBody
                                });
                            }
                        }
                        return {
                            tool_call_id: action.id,
                            output: `{success: true, msg:'Creado correctamente', quoteNumber:'${newCustomer === null || newCustomer === void 0 ? void 0 : newCustomer.quoteNumber}' }`
                        };
                    }
                    if (functionName === 'update_customer_info') {
                        const clientInfo = JSON.parse(action.function.arguments);
                        const { customer_name, customer_lastname, email, phone, location } = clientInfo;
                        yield new update_customer_use_case_1.UpdateCustomerUseCase(this.customerRepository).execute({
                            name: customer_name,
                            lastname: customer_lastname,
                            email,
                            location,
                            phone,
                            id: ""
                        });
                        return {
                            tool_call_id: action.id,
                            output: "{success: true, msg:'Actualizado correctamente'}"
                        };
                    }
                    return {
                        tool_call_id: action.id,
                        output: "{success: true}"
                    };
                }))) !== null && _b !== void 0 ? _b : []);
                yield this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs });
                console.log(tool_outputs[0].output);
            }
            if (status === 'completed') {
                return runStatus;
            }
            yield new Promise(resolve => setTimeout(resolve, 1000));
            yield this.execute(options);
        });
    }
}
exports.CheckCompleteStatusUseCase = CheckCompleteStatusUseCase;
// export const checkCompleteStatusUseCase = async (openai: OpenAI, options: Options) => {
//   const { threadId, runId } = options
//   const runStatus = await openai.beta.threads.runs.retrieve(
//     threadId,
//     runId
//   )
//   const status = runStatus.status
//   console.log({ status })
//   const requiredAction = runStatus.required_action?.submit_tool_outputs.tool_calls
//   let tool_outputs = []
//   if (status === 'requires_action') {
//     tool_outputs = requiredAction!.map(action => {
//       const functionName = action.function.name
//       console.log({ functionName })
//       if (functionName === 'extract_customer_info') {
//         const clientInfo = JSON.parse(action.function.arguments) as ExtractedData
//         console.log({ clientInfo })
//       }
//       return {
//         tool_call_id: action.id,
//         output: "{success: true}"
//       }
//     }) ?? []
//     openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs })
//   }
//   if (status === 'completed') {
//     return runStatus
//   }
//   await new Promise(resolve => setTimeout(resolve, 1000))
//   await checkCompleteStatusUseCase(openai, options)
// }
const quote = {
    created: 'automatyic date when is procesed, put current date',
    client: {
        name: 'name of client',
        surname: 'last name of client',
        email: ' email of client',
    },
    items: [
        {
            description: 'description of item or product', quantity: 'quantity of item or product'
        }
    ],
    itemsMatch: [
        {
            description: 'vas a tomar la descripcion de la informacion que tienes del catalogo', code: 'vas a poner el codigo que esta en la informacion que tienes de los productos', ean: 'ean'
        }
    ]
};
