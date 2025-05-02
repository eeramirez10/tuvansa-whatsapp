import { AuthDatasource } from "../../domain/datasource/auth.datasource";
import { CheckFieldDto } from "../../domain/dtos/auth/check-field.dto";
import { CreateUserDto } from "../../domain/dtos/auth/create-user.dto";
import { LoginUserDto } from "../../domain/dtos/auth/login-user.dto";


import { AuthRepository } from "../../domain/repositories/auth.repository";
import { UserEntity } from '../../domain/entities/user.entity';

export class AuthRepositoryImpl implements AuthRepository {

  constructor(private readonly authDatasource: AuthDatasource) { }


  checkField(checkFieldDto: CheckFieldDto): Promise<Boolean> {
   return this.authDatasource.checkField(checkFieldDto)
  }

  login(loginUserDto: LoginUserDto): Promise<UserEntity> {
    return this.authDatasource.login(loginUserDto)
  }
  create(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.authDatasource.create(createUserDto)
  }


}