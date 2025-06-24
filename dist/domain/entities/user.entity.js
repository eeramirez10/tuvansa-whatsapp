"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEntity = void 0;
class UserEntity {
    constructor(options) {
        this.name = options.name;
        this.id = options.id;
        this.lastname = options.lastname;
        this.email = options.email;
        this.phone = options.phone;
        this.password = options.password;
        this.role = options.role;
        this.isActive = options.isActive;
        this.createdAt = options.createdAt;
        this.updatedAt = options.updatedAt;
        this.username = options.username;
    }
}
exports.UserEntity = UserEntity;
