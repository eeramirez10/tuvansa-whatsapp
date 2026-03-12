import { PrismaClient } from "@prisma/client";
import { BranchDatasource } from "../../domain/datasource/branch.datasource";
import { CreateBranchDto } from "../../domain/dtos/branch/create-branch.dto";
import { UpdateBranchDto } from "../../domain/dtos/branch/update-branch.dto";
import { BranchEntity } from "../../domain/entities/branch.entity";
import { AssingnManagerResponse } from "../../domain/dtos/branch/assign-manager-response";
import { GetAssignedManagerResponse } from "../../domain/dtos/branch/get-assigned-manager-response";
import { BranchAssignManagerError, BranchNotFoundError, ManagerNotAssignedError } from "../../domain/errors/branch.error";
import { GetBranchesResponse } from "../../domain/dtos/branch/get-branches-response";




const prismaClient = new PrismaClient()

export class BranchPostgresqlDatasource implements BranchDatasource {

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<BranchEntity> {
    const branch = await prismaClient.branch.findUnique({ where: { id } })
    if (!branch) {
      throw new BranchNotFoundError(`Branch not found with id ${id}`)
    }

    return prismaClient.branch.update({
      where: { id },
      data: {
        name: updateBranchDto.name,
        address: updateBranchDto.address
      }
    })
  }


  async assignManager(id: string, managerId: string): Promise<AssingnManagerResponse> {

    try {

      const branch = await prismaClient.branch.findUnique({ where: { id } })

      if (!branch) {
        throw new BranchNotFoundError(`Branch not found with id ${id}`);
      }

      let manager = await prismaClient.user.findUnique({
        where: { id: managerId },
        select: { id: true, role: true }
      })
      if (!manager) {
        throw new BranchAssignManagerError('Manager no encontrado')
      }
      if (manager.role !== 'BRANCH_MANAGER') {
        throw new BranchAssignManagerError('Solo usuarios BRANCH_MANAGER pueden gestionar múltiples sucursales')
      }

      const updatedBranch = await prismaClient.$transaction(async (tx) => {
        const updated = await tx.branch.update({
          where: { id },
          data: { managerId },
          include: { manager: true }
        })

        await tx.userBranchAssignment.upsert({
          where: {
            userId_branchId: {
              userId: managerId,
              branchId: id
            }
          },
          create: {
            userId: managerId,
            branchId: id
          },
          update: {}
        })

        await tx.user.updateMany({
          where: {
            id: managerId,
            branchId: null
          },
          data: {
            branchId: id
          }
        })

        return updated
      })

      const newManager = updatedBranch.manager

      updatedBranch.manager.name

      return new AssingnManagerResponse({
        id: updatedBranch.managerId,
        name: newManager.name,
        lastname: newManager.lastname,
        username: newManager.username,
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
  async getBranchs(): Promise<GetBranchesResponse[]> {
    return await prismaClient.branch.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        managerId: true,
        manager: {
          select: {
            id: true,
            name: true,
            lastname: true,
            username: true
          }
        }
      }
    });
  }

}
