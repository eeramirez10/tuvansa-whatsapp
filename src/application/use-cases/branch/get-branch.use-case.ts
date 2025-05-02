import { BranchRepository } from "../../../domain/repositories/branch.repository";


export class GetBranchUseCase {

    constructor(private readonly branchRepository: BranchRepository) { }
  
    execute(id:string) {
      return this.branchRepository.getBranch(id)
    }
}