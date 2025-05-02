import { CreateBranchDto } from '../dtos/branch/create-branch.dto';
import { BranchEntity } from '../entities/branch.entity';


export abstract class BranchDatasource {


  abstract create(createBranchDto: CreateBranchDto): Promise<BranchEntity>

  abstract getBranchs(): Promise<BranchEntity[]>

  abstract getBranch(id: string): Promise<BranchEntity>

}