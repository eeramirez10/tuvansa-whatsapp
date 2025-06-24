"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepositoryImpl = void 0;
class AuthRepositoryImpl {
    constructor(authDatasource) {
        this.authDatasource = authDatasource;
    }
    checkField(checkFieldDto) {
        return this.authDatasource.checkField(checkFieldDto);
    }
    login(loginUserDto) {
        return this.authDatasource.login(loginUserDto);
    }
    create(createUserDto) {
        return this.authDatasource.create(createUserDto);
    }
}
exports.AuthRepositoryImpl = AuthRepositoryImpl;
