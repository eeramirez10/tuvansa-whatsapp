"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBranchUseCase = void 0;
class CreateBranchUseCase {
    constructor(branchRepository) {
        this.branchRepository = branchRepository;
    }
    execute(createBranchDto) {
        return this.branchRepository.create(createBranchDto);
    }
}
exports.CreateBranchUseCase = CreateBranchUseCase;
