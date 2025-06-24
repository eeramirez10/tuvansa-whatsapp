"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBranchUseCase = void 0;
class GetBranchUseCase {
    constructor(branchRepository) {
        this.branchRepository = branchRepository;
    }
    execute(id) {
        return this.branchRepository.getBranch(id);
    }
}
exports.GetBranchUseCase = GetBranchUseCase;
