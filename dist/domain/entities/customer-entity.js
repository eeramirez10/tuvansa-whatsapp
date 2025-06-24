"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerEntity = void 0;
class CustomerEntity {
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.lastname = options.lastname;
        this.email = options.email;
        this.phone = options.phone;
        this.location = options.location;
        this.createdAt = options.createdAt;
    }
}
exports.CustomerEntity = CustomerEntity;
