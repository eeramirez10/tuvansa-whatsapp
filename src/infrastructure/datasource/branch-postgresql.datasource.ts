import { PrismaClient } from "@prisma/client";
import { BranchDatasource } from "../../domain/datasource/branch.datasource";
import { CreateBranchDto } from "../../domain/dtos/branch/create-branch.dto";
import { BranchEntity } from "../../domain/entities/branch.entity";



const prismaClient = new PrismaClient()

export class BranchPostgresqlDatasource implements BranchDatasource {


  getBranch(id: string): Promise<BranchEntity> {
    return prismaClient.branch.findUnique({
      where: {
        id
      },

    })
  }


  async create(createBranchDto: CreateBranchDto): Promise<BranchEntity> {

    const { ...rest } = createBranchDto
    return await prismaClient.branch.create({ data: rest })
  }
  async getBranchs(): Promise<BranchEntity[]> {
    return await prismaClient.branch.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  }

}