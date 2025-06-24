"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBranchDto = void 0;
class CreateBranchDto {
    constructor(options) {
        this.name = options.name;
        this.address = options.address;
    }
    static execute(branch) {
        const { name, address } = branch;
        if (!name)
            return ['Name of branch is required'];
        if (!address)
            return ['Address is required'];
        return [, new CreateBranchDto(branch)];
    }
}
exports.CreateBranchDto = CreateBranchDto;
