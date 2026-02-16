import { PrismaClient } from "@prisma/client";
import { BranchDatasource } from "../../domain/datasource/branch.datasource";
import { CreateBranchDto } from "../../domain/dtos/branch/create-branch.dto";
import { BranchEntity } from "../../domain/entities/branch.entity";
import { AssingnManagerResponse } from "../../domain/dtos/branch/assign-manager-response";
import { GetAssignedManagerResponse } from "../../domain/dtos/branch/get-assigned-manager-response";
import { BranchAssignManagerError, BranchNotFoundError, ManagerNotAssignedError } from "../../domain/errors/branch.error";




const prismaClient = new PrismaClient()

export class BranchPostgresqlDatasource implements BranchDatasource {


  async assignManager(id: string, managerId: string): Promise<AssingnManagerResponse> {

    try {

      const branch = await prismaClient.branch.findUnique({ where: { id } })

      if (!branch) {
        throw new BranchNotFoundError(`Branch not found with id ${id}`);
      }

      const updatedBranch = await prismaClient.branch.update({
        where: { id },
        data: { managerId },
        include: { manager: true }
      })

      const manager = updatedBranch.manager

      return new AssingnManagerResponse({
        id: updatedBranch.managerId,
        name: manager.name,
        lastname: manager.lastname,
        username: manager.username,
        branchName: updatedBranch.name,
      })

    } catch (error) {

      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new BranchAssignManagerError(message);

    }



  }


  async getAssignedManager(branchId: string): Promise<GetAssignedManagerResponse> {
    try {
      const branch = await prismaClient.branch.findUnique({
        where: { id: branchId },
        include: { manager: true }
      });

      if (!branch) {
        throw new BranchNotFoundError(`Branch not found with id ${branchId}`);
      }

      if (!branch.manager) {
        throw new ManagerNotAssignedError(branchId);
      }

      return new GetAssignedManagerResponse({
        id: branch.manager.id,
        name: branch.manager.name,
        lastname: branch.manager.lastname,
        email: branch.manager.email,
        phone: branch.manager.phone,
        branchName: branch.name,
      });
    } catch (error) {
      if (error instanceof BranchNotFoundError || error instanceof ManagerNotAssignedError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new BranchAssignManagerError(message);
    }
  }


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
      select: {
        id: true,
        name: true,
        address: true
      }
    });
  }

}