"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BranchRepositoryImpl = void 0;
class BranchRepositoryImpl {
    constructor(branchDatasource) {
        this.branchDatasource = branchDatasource;
    }
    getBranch(id) {
        return this.branchDatasource.getBranch(id);
    }
    create(createBranchDto) {
        return this.branchDatasource.create(createBranchDto);
    }
    getBranchs() {
        return this.branchDatasource.getBranchs();
    }
}
exports.BranchRepositoryImpl = BranchRepositoryImpl;
