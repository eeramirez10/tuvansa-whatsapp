"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteHistoryEntity = void 0;
class QuoteHistoryEntity {
    constructor(options) {
        this.id = options.id;
        this.oldStatus = options.oldStatus;
        this.newStatus = options.newStatus;
        this.changedAt = options.changedAt;
        this.userId = options.userId;
        this.quoteId = options.quoteId;
        this.snapshot = options.snapshot;
    }
}
exports.QuoteHistoryEntity = QuoteHistoryEntity;
