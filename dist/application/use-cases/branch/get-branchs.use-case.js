"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBranchsUseCase = void 0;
class GetBranchsUseCase {
    constructor(branchRepository) {
        this.branchRepository = branchRepository;
    }
    execute() {
        return this.branchRepository.getBranchs();
    }
}
exports.GetBranchsUseCase = GetBranchsUseCase;
