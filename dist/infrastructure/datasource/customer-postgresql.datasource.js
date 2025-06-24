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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerPostgresqlDatasource = void 0;
const client_1 = require("@prisma/client");
const customer_datasource_1 = require("../../domain/datasource/customer.datasource");
const prismaClient = new client_1.PrismaClient();
class CustomerPostgresqlDatasource extends customer_datasource_1.CustomerDatasource {
    getCustomers() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prismaClient.customer.findMany({
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    quotes: true
                }
            });
        });
    }
    getCustomerByQuoteNumber(quoteNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prismaClient.customer.findFirst({
                where: {
                    quotes: {
                        some: {
                            quoteNumber
                        }
                    }
                },
                include: {
                    quotes: {
                        include: {
                            items: true
                        }
                    }
                }
            });
        });
    }
    getById(customerId) {
        console.log({ customerId });
        return prismaClient.customer.findFirst({
            where: {
                id: customerId
            },
            include: {
                quotes: {
                    include: {
                        customer: true
                    }
                },
                chatThreads: true
            }
        });
    }
    updateCustomer(updateCustometDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = updateCustometDto, rest = __rest(updateCustometDto, ["id"]);
            return yield prismaClient.customer.update({
                where: {
                    phone: rest.phone
                },
                data: Object.assign({}, rest)
            });
        });
    }
    findByPhone(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prismaClient.customer.findFirst({
                where: {
                    phone: phoneNumber
                }
            });
        });
    }
    createCustomer(createCustomerDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, lastname, email, phone, location = '', } = createCustomerDto;
            try {
                return yield prismaClient.customer.create({
                    data: {
                        name,
                        lastname,
                        email,
                        phone,
                        location,
                    }
                });
            }
            catch (error) {
                console.log(error);
                throw Error('Hubo un error en Customer revisar logs');
            }
            finally {
                prismaClient.$disconnect();
            }
        });
    }
}
exports.CustomerPostgresqlDatasource = CustomerPostgresqlDatasource;
