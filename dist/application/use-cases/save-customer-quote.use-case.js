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
exports.SaveCustomerQuoteUseCase = void 0;
const create_customer_use_case_1 = require("./create-customer.use-case");
const save_quote_use_case_1 = require("./save-quote.use-case");
const add_quote_items_use_case_1 = require("./add-quote-items.use-case");
class SaveCustomerQuoteUseCase {
    constructor(quoteRepository, customerRepository) {
        this.quoteRepository = quoteRepository;
        this.customerRepository = customerRepository;
    }
    execute(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, lastname, email, phone, location, items = [], fileKey } = options;
            const createCustomer = yield new create_customer_use_case_1.CreateCustomerUseCase(this.customerRepository).execute({
                name,
                lastname,
                email,
                phone,
                location,
            });
            const newQuote = yield new save_quote_use_case_1.SaveQuoteUseCase(this.quoteRepository).execute({ customerId: createCustomer.id, fileKey });
            for (let item of items) {
                if (items.length === 0)
                    break;
                const addItems = yield new add_quote_items_use_case_1.AddQuoteItemsUseCase(this.quoteRepository).execute(Object.assign({ price: 0, cost: 0, quoteId: newQuote.id }, item));
            }
            return this.quoteRepository.findByQuoteNumber({ quoteNumber: newQuote.quoteNumber });
        });
    }
}
exports.SaveCustomerQuoteUseCase = SaveCustomerQuoteUseCase;
