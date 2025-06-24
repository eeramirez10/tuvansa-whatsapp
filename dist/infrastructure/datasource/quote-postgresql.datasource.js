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
exports.QuotePostgresqlDatasource = void 0;
const client_1 = require("@prisma/client");
const quote_datasource_1 = require("../../domain/datasource/quote.datasource");
const prismaClient = new client_1.PrismaClient();
class QuotePostgresqlDatasource extends quote_datasource_1.QuoteDatasource {
    updateQuoteItem(id, updateQuoteItemDto) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prismaClient.quoteItem.update({
                where: { id },
                data: updateQuoteItemDto
            });
        });
    }
    getQuote(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return prismaClient.quote.findFirst({
                    where: {
                        id
                    },
                    include: {
                        customer: true,
                        items: true,
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en Quote revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
    getQuotes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prismaClient.quote.findMany({
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        customer: true,
                        items: true,
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en Quote revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
    findByQuoteNumber(_a) {
        return __awaiter(this, arguments, void 0, function* ({ quoteNumber }) {
            try {
                return yield prismaClient.quote.findFirst({
                    where: { quoteNumber },
                    include: {
                        customer: true,
                        items: true
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en Quote revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
    getNextQuoteNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            const findQuoteName = yield prismaClient.counter.findFirst({ where: { name: 'quote' } });
            console.log({ findQuoteName });
            if (!findQuoteName) {
                const res = yield prismaClient.counter.create({
                    data: {
                        name: 'quote',
                        value: 0
                    }
                });
                console.log({ res });
            }
            const [res] = yield prismaClient.$queryRaw `
    UPDATE "Counter"
    SET "value" = "value" + 1
    WHERE "name" = 'quote'
    RETURNING "value"
  `;
            if (!res)
                throw new Error('No existe un contador para "quote"');
            return res.value;
        });
    }
    createQuote(createQuoteDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { customerId, fileKey } = createQuoteDto;
            try {
                const quoteNumber = yield this.getNextQuoteNumber();
                return yield prismaClient.quote.create({
                    data: {
                        quoteNumber,
                        customerId,
                        fileKey
                    },
                    include: {
                        customer: true,
                        items: true
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en Quote revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
    addQuoteItems(addQuoteItems) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prismaClient.quoteItem.create({
                    data: Object.assign({}, addQuoteItems)
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en Quote revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
}
exports.QuotePostgresqlDatasource = QuotePostgresqlDatasource;
