"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteRepositoryImpl = void 0;
const quote_repository_1 = require("../../domain/repositories/quote.repository");
class QuoteRepositoryImpl extends quote_repository_1.QuoteRepository {
    constructor(quoteDatasource) {
        super();
        this.quoteDatasource = quoteDatasource;
    }
    updateQuoteItem(id, updateQuoteItemDto) {
        return this.quoteDatasource.updateQuoteItem(id, updateQuoteItemDto);
    }
    getQuote(id) {
        return this.quoteDatasource.getQuote(id);
    }
    getQuotes() {
        return this.quoteDatasource.getQuotes();
    }
    findByQuoteNumber({ quoteNumber }) {
        return this.quoteDatasource.findByQuoteNumber({ quoteNumber });
    }
    createQuote(createQuoteDto) {
        return this.quoteDatasource.createQuote(createQuoteDto);
    }
    addQuoteItems(addQuoteItems) {
        return this.quoteDatasource.addQuoteItems(addQuoteItems);
    }
}
exports.QuoteRepositoryImpl = QuoteRepositoryImpl;
