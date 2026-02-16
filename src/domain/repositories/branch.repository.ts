

import { AssingnManagerResponse } from '../dtos/branch/assign-manager-response';
import { GetAssignedManagerResponse } from '../dtos/branch/get-assigned-manager-response';
import { CreateBranchDto } from '../dtos/branch/create-branch.dto';
import { BranchEntity } from '../entities/branch.entity';
import { GetBranchesResponse } from '../dtos/branch/get-branches-response';


export abstract class BranchRepository {


  abstract create(createBranchDto: CreateBranchDto): Promise<BranchEntity>

  abstract getBranchs(): Promise<GetBranchesResponse[]>

  abstract getBranch(id: string): Promise<BranchEntity>

  abstract assignManager(id: string, managerId: string): Promise<AssingnManagerResponse>

  abstract getAssignedManager(branchId: string): Promise<GetAssignedManagerResponse>


}