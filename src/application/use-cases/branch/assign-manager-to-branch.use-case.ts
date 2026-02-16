import { AssingnManagerRequest } from '../../../domain/dtos/branch/assign-manager-request';
import { BranchRepository } from '../../../domain/repositories/branch.repository';


export class AssignManagerToBranchUseCase {


  constructor(private readonly branchRepository:BranchRepository){}


  async execute(request:AssingnManagerRequest){

    const id = request.id
    const managerId = request.managerId


    return await this.branchRepository.assignManager(id, managerId)

  }
}