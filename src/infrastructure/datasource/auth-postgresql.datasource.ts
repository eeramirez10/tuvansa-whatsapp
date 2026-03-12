import { PrismaClient } from "@prisma/client";
import { BcryptAdapter } from "../../config/bcrypt";
import { AuthDatasource } from "../../domain/datasource/auth.datasource";
import { CreateUserDto } from "../../domain/dtos/auth/create-user.dto";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";

import { CustomError } from "../../domain/errors/custom-error";
import { CheckFieldDto } from "../../domain/dtos/auth/check-field.dto";

import { PaginationResult } from "../../domain/entities/pagination-result";
import { UserEntity } from "../../domain/entities/user.entity";


interface Option {

  hashPassword: (password: string) => string
  comparePassword: (pasword: string, hashed: string) => boolean

}

const prismaClient = new PrismaClient()

type HashFunction = (password: string) => string;
type CompareFunction = (password: string, hashed: string) => boolean;

export class AuthPostgresqlDatasource implements AuthDatasource {

  constructor(
    private readonly hashPassword: HashFunction = BcryptAdapter.hash,
    private readonly comparePassword: CompareFunction = BcryptAdapter.compare,
  ) { }


  list(): Promise<PaginationResult<UserEntity>> {
    throw new Error("Method not implemented.");
  }



  async checkField(checkFieldDto: CheckFieldDto): Promise<Boolean> {
    const { field, value } = checkFieldDto
    const user = await prismaClient.user.findFirst({
      where: {
        [field]: value
      }
    })

    return Boolean(user)
  }

  async login(loginUserDto: LoginUserDto): Promise<UserEntity | null> {
    const { email, password } = loginUserDto

    const user = await prismaClient.user.findFirst({
      where: {
        email
      },
      include: {
        branch: true,
        branchAssignments: {
          include: {
            branch: true
          }
        }
      }
    })

    if (!user) throw CustomError.BadRequest('Email was not Found')

    if (!this.comparePassword(password, user.password)) throw CustomError.BadRequest('Incorrect Password')

    return user
  }



  async create(createUserDto: CreateUserDto): Promise<UserEntity> {

    const { password, branchIds, ...rest } = createUserDto

    // console.log(rest)

    const existUser = await prismaClient.user.findUnique({ where: { email: rest.email } })

    if (existUser) {
      throw CustomError.BadRequest('User already exist')
    }

    if (rest.role !== 'BRANCH_MANAGER' && branchIds.length > 1) {
      throw CustomError.BadRequest('Solo BRANCH_MANAGER puede tener múltiples sucursales')
    }

    const branches = await prismaClient.branch.findMany({
      where: {
        id: {
          in: branchIds
        }
      },
      select: { id: true }
    })

    if (branches.length !== branchIds.length) {
      throw CustomError.BadRequest('Branch not found')
    }

    const hashedPassword = this.hashPassword(password)

    const newUser = await prismaClient.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...rest,
          branchId: branchIds[0] ?? null,
          password: hashedPassword,
        }
      })

      if (branchIds.length > 0) {
        await tx.userBranchAssignment.createMany({
          data: branchIds.map((branchId) => ({
            userId: user.id,
            branchId
          })),
          skipDuplicates: true
        })
      }

      return tx.user.findUniqueOrThrow({
        where: { id: user.id },
        include: {
          branch: true,
          branchAssignments: {
            include: {
              branch: true
            }
          }
        }
      })
    })

    return newUser



  }


}
