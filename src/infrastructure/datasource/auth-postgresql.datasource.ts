import { PrismaClient } from "@prisma/client";
import { BcryptAdapter } from "../../config/bcrypt";
import { AuthDatasource } from "../../domain/datasource/auth.datasource";
import { CreateUserDto } from "../../domain/dtos/auth/create-user.dto";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";

import { CustomError } from "../../domain/errors/custom-error";
import { CheckFieldDto } from "../../domain/dtos/auth/check-field.dto";
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
        branch: true
      }
    })

    if (!user) throw CustomError.BadRequest('Email was not Found')

    if (!this.comparePassword(password, user.password)) throw CustomError.BadRequest('Incorrect Password')


    return user




  }



  async create(createUserDto: CreateUserDto): Promise<UserEntity> {

    const { password, ...rest } = createUserDto

    console.log(rest)

    const existUser = await prismaClient.user.findUnique({ where: { email: rest.email } })

    if (existUser) {
      throw CustomError.BadRequest('User already exist')
    }

    const hashedPassword = this.hashPassword(password)

    const newUser = await prismaClient.user.create({
      data: {
        ...rest,
        password: hashedPassword,
      }
    })

    return newUser



  }


}