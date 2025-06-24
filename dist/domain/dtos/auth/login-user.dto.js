"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginUserDto = void 0;
const validators_1 = require("../../../config/validators");
class LoginUserDto {
    constructor(email, password) {
        this.email = email;
        this.password = password;
    }
    static execute(options) {
        console.log(options);
        const { email, password } = options;
        if (!email)
            return ['El email es requerido'];
        if (!validators_1.Validators.email.test(email))
            return ['No es un correo valido '];
        if (!password)
            return ['La contraseña es requerida'];
        if (password.length < 5)
            ['La contraseña es muy corta'];
        return [undefined, new LoginUserDto(email, password)];
    }
}
exports.LoginUserDto = LoginUserDto;
