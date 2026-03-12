import { UpdateBranchDto } from "../../../domain/dtos/branch/update-branch.dto";
import { BranchRepository } from "../../../domain/repositories/branch.repository";

export class UpdateBranchUseCase {
  constructor(private readonly branchRepository: BranchRepository) { }

  execute(id: string, updateBranchDto: UpdateBranchDto) {
    return this.branchRepository.update(id, updateBranchDto)
  }
}
