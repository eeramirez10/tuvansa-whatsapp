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
exports.AuthPostgresqlDatasource = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = require("../../config/bcrypt");
const custom_error_1 = require("../../domain/errors/custom-error");
const prismaClient = new client_1.PrismaClient();
class AuthPostgresqlDatasource {
    constructor(hashPassword = bcrypt_1.BcryptAdapter.hash, comparePassword = bcrypt_1.BcryptAdapter.compare) {
        this.hashPassword = hashPassword;
        this.comparePassword = comparePassword;
    }
    checkField(checkFieldDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { field, value } = checkFieldDto;
            const user = yield prismaClient.user.findFirst({
                where: {
                    [field]: value
                }
            });
            return Boolean(user);
        });
    }
    login(loginUserDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password } = loginUserDto;
            const user = yield prismaClient.user.findFirst({
                where: {
                    email
                },
                include: {
                    branch: true
                }
            });
            if (!user)
                throw custom_error_1.CustomError.BadRequest('Email was not Found');
            if (!this.comparePassword(password, user.password))
                throw custom_error_1.CustomError.BadRequest('Incorrect Password');
            return user;
        });
    }
    create(createUserDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { password } = createUserDto, rest = __rest(createUserDto, ["password"]);
            console.log(rest);
            const existUser = yield prismaClient.user.findUnique({ where: { email: rest.email } });
            if (existUser) {
                throw custom_error_1.CustomError.BadRequest('User already exist');
            }
            const hashedPassword = this.hashPassword(password);
            const newUser = yield prismaClient.user.create({
                data: Object.assign(Object.assign({}, rest), { password: hashedPassword })
            });
            return newUser;
        });
    }
}
exports.AuthPostgresqlDatasource = AuthPostgresqlDatasource;
