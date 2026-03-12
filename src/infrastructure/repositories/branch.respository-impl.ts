import { CreateBranchDto } from "../../domain/dtos/branch/create-branch.dto";
import { UpdateBranchDto } from "../../domain/dtos/branch/update-branch.dto";
import { BranchEntity } from "../../domain/entities/branch.entity";
import { BranchRepository } from "../../domain/repositories/branch.repository";
import { BranchDatasource } from '../../domain/datasource/branch.datasource';
import { AssingnManagerResponse } from "../../domain/dtos/branch/assign-manager-response";
import { GetAssignedManagerResponse } from "../../domain/dtos/branch/get-assigned-manager-response";
import { GetBranchesResponse } from '../../domain/dtos/branch/get-branches-response';

export class BranchRepositoryImpl implements BranchRepository {

  constructor(private readonly branchDatasource: BranchDatasource) { }

  assignManager(id: string, managerId: string): Promise<AssingnManagerResponse> {
    return this.branchDatasource.assignManager(id, managerId);
  }

  getAssignedManager(branchId: string): Promise<GetAssignedManagerResponse> {
    return this.branchDatasource.getAssignedManager(branchId);
  }

  getBranch(id: string): Promise<BranchEntity> {
    return this.branchDatasource.getBranch(id)
  }

  update(id: string, updateBranchDto: UpdateBranchDto): Promise<BranchEntity> {
    return this.branchDatasource.update(id, updateBranchDto)
  }

  create(createBranchDto: CreateBranchDto): Promise<BranchEntity> {
    return this.branchDatasource.create(createBranchDto)
  }


  getBranchs(): Promise<GetBranchesResponse[]> {
    return this.branchDatasource.getBranchs()
  }


}
