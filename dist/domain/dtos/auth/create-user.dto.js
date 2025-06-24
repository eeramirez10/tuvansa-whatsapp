"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserDto = void 0;
const validators_1 = require("../../../config/validators");
class CreateUserDto {
    constructor(options) {
        this.name = options.name;
        this.lastname = options.lastname;
        this.email = options.email;
        this.phone = options.phone;
        this.password = options.password;
        this.role = options.role;
        this.isActive = options.isActive;
        this.username = options.username;
        this.branchId = options.branchId;
    }
    static execute(options) {
        const { name, lastname, email, phone = '', password, role = 'USER', isActive = true, branchId, username } = options;
        if (!name)
            return ['Missing name'];
        if (!lastname)
            return ['Missing lastname'];
        if (!username)
            return ['Missing username'];
        if (!email)
            return ['Missing email'];
        if (!branchId)
            return ['Missing branchId'];
        if (!validators_1.Validators.email.test(email))
            return ['Email is not valid'];
        if (!password)
            return ['Missing password'];
        if (password.length < 6)
            return ['Password too short'];
        return [undefined, new CreateUserDto({ name, lastname, email, phone, password, role, isActive, branchId, username })];
    }
}
exports.CreateUserDto = CreateUserDto;
