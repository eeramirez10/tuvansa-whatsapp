import { CreateBranchDto } from "../../domain/dtos/branch/create-branch.dto";
import { BranchEntity } from "../../domain/entities/branch.entity";
import { BranchRepository } from "../../domain/repositories/branch.repository";
import { BranchDatasource } from '../../domain/datasource/branch.datasource';

export class BranchRepositoryImpl implements BranchRepository {

  constructor( private readonly branchDatasource: BranchDatasource) { }


  getBranch(id: string): Promise<BranchEntity> {
    return this.branchDatasource.getBranch(id)
  }

  create(createBranchDto: CreateBranchDto): Promise<BranchEntity> {
    return this.branchDatasource.create(createBranchDto)
  }

  
  getBranchs(): Promise<BranchEntity[]> {
    return this.branchDatasource.getBranchs()
  }


}