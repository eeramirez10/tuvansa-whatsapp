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
exports.LoginUserUseCase = void 0;
const jwt_1 = require("../../../config/jwt");
const custom_error_1 = require("../../../domain/errors/custom-error");
class LoginUserUseCase {
    constructor(authRepository, signToken = jwt_1.JwtAdapter.generateToken) {
        this.authRepository = authRepository;
        this.signToken = signToken;
    }
    execute(loginUserDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const _a = yield this.authRepository.login(loginUserDto), { id, password } = _a, rest = __rest(_a, ["id", "password"]);
            const token = yield this.signToken({ id });
            if (!token)
                throw custom_error_1.CustomError.internalServer('Error generating token');
            return {
                token,
                user: Object.assign({ id }, rest)
            };
        });
    }
}
exports.LoginUserUseCase = LoginUserUseCase;
