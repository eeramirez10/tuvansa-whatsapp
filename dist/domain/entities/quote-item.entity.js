"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteItemEntity = void 0;
class QuoteItemEntity {
    constructor(options) {
        this.id = options.id;
        this.description = options.description;
        this.ean = options.ean;
        this.codigo = options.codigo;
        this.price = options.price;
        this.cost = options.cost;
        this.quoteId = options.quoteId;
        this.quantity = options.quantity;
        this.um = options.um;
    }
}
exports.QuoteItemEntity = QuoteItemEntity;
