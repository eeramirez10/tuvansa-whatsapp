"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchEntity = void 0;
class BranchEntity {
    constructor(options) {
        this.name = options.name;
        this.id = options.id;
        this.address = options.address;
        this.createdAt = options.createdAt;
        this.updatedAt = options.updatedAt;
    }
}
exports.BranchEntity = BranchEntity;
