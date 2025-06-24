"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetQuotesUseCase = void 0;
class GetQuotesUseCase {
    constructor(quoteRepository) {
        this.quoteRepository = quoteRepository;
    }
    execute() {
        return this.quoteRepository.getQuotes();
    }
}
exports.GetQuotesUseCase = GetQuotesUseCase;
