import { BranchRepository } from "../../../domain/repositories/branch.repository";
import { CreateBranchDto } from '../../../domain/dtos/branch/create-branch.dto';


export class CreateBranchUseCase {

  constructor(private readonly branchRepository: BranchRepository) { }

  execute(createBranchDto: CreateBranchDto) {


    return this.branchRepository.create(createBranchDto)

  }



}