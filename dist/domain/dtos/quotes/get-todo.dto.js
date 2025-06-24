"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTodoDto = void 0;
const uuid_1 = require("uuid");
class GetTodoDto {
    constructor(option) {
        this.id = option.id;
    }
    static execute(options) {
        const { id } = options;
        if (!id)
            return ['El id es necesario'];
        if (!(0, uuid_1.validate)(id))
            return ['No es un id valido'];
        return [undefined, new GetTodoDto({ id })];
    }
}
exports.GetTodoDto = GetTodoDto;
