"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckFieldDto = void 0;
class CheckFieldDto {
    constructor(options) {
        this.field = options.field;
        this.value = options.value;
    }
    static execute(options) {
        const { field, value } = options;
        const allowedFileds = ['email', 'username'];
        if (!field)
            return ['field is required'];
        if (!value)
            return ['value is required'];
        if (!allowedFileds.includes(field))
            return [`${field} is no allowed`];
        return [undefined, new CheckFieldDto({ field, value })];
    }
}
exports.CheckFieldDto = CheckFieldDto;
