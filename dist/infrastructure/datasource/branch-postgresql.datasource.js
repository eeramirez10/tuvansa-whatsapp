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
exports.BranchPostgresqlDatasource = void 0;
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
class BranchPostgresqlDatasource {
    getBranch(id) {
        return prismaClient.branch.findUnique({
            where: {
                id
            }
        });
    }
    create(createBranchDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const rest = __rest(createBranchDto, []);
            return yield prismaClient.branch.create({ data: rest });
        });
    }
    getBranchs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prismaClient.branch.findMany();
        });
    }
}
exports.BranchPostgresqlDatasource = BranchPostgresqlDatasource;
