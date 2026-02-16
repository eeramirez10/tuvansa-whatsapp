import { BranchRepository } from '../../../domain/repositories/branch.repository';

export class GetAssignedManagerUseCase {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(branchId: string) {
    return await this.branchRepository.getAssignedManager(branchId);
  }
}
