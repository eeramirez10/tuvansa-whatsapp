"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetQuoteById = void 0;
class GetQuoteById {
    constructor(quoteRepository) {
        this.quoteRepository = quoteRepository;
    }
    execute(id) {
        return this.quoteRepository.getQuote(id);
    }
}
exports.GetQuoteById = GetQuoteById;
