"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteEntity = void 0;
class QuoteEntity {
    constructor(options) {
        this.id = options.id;
        this.createdAt = options.createdAt;
        this.quoteNumber = options.quoteNumber;
        this.customerId = options.customerId;
        this.items = options.items;
        this.customer = options.customer;
    }
}
exports.QuoteEntity = QuoteEntity;
