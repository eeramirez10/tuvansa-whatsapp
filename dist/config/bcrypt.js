"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BcryptAdapter = void 0;
const bcryptjs_1 = require("bcryptjs");
class BcryptAdapter {
    static hash(password) {
        return (0, bcryptjs_1.hashSync)(password);
    }
    static compare(pasword, hashed) {
        return (0, bcryptjs_1.compareSync)(pasword, hashed);
    }
}
exports.BcryptAdapter = BcryptAdapter;
