import { NextFunction, Request, Response } from 'express';
import { BranchRepository } from '../../domain/repositories/branch.repository';
import { CreateBranchDto } from '../../domain/dtos/branch/create-branch.dto';
import { CreateBranchUseCase } from '../../application/use-cases/branch/create-branch.use-case';
import { GetBranchUseCase } from '../../application/use-cases/branch/get-branch.use-case';
import { GetBranchsUseCase } from '../../application/use-cases/branch/get-branchs.use-case';


export class BranchController {


  constructor(private readonly branchRepository: BranchRepository) { }

  createBranch = (req: Request, res: Response, next: NextFunction) => {

    const body = req.body

    const [error, createBranchDto] = CreateBranchDto.execute(body)

    if (error) {
      res.status(400).json({ error })
      return
    }

    new CreateBranchUseCase(this.branchRepository)
      .execute(createBranchDto)
      .then(data => {
        res.json({ ...data })
      })
      .catch((error) => {
        res.status(500).json(error)
      })
  }

  getBranch = (req: Request, res: Response) => {

    const id = req.params.id

    new GetBranchUseCase(this.branchRepository)
      .execute(id)
      .then((branch) => {
        res.json(branch)
      })
      .catch((error) => {
        res.status(500).json(error)
      })
  }

  getBranchs = (req: Request, res: Response) => {



    new GetBranchsUseCase(this.branchRepository)
      .execute()
      .then((branchs) => {
        res.json(branchs)
      })
      .catch((error) => {
        res.status(500).json(error)
      })
  }
  

}