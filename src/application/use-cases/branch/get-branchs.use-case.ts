import { BranchRepository } from "../../../domain/repositories/branch.repository";


export class GetBranchsUseCase {

    constructor(private readonly branchRepository: BranchRepository) { }
    
      execute() {
        return this.branchRepository.getBranchs()
      }

}