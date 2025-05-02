import { CheckFieldDto } from "../dtos/auth/check-field.dto";
import { CreateUserDto } from "../dtos/auth/create-user.dto";
import { LoginUserDto } from "../dtos/auth/login-user.dto";
import { UserEntity } from "../entities/user.entity";


export abstract class AuthRepository {


  abstract login(loginUserDto: LoginUserDto): Promise<UserEntity>

  abstract create(createUserDto: CreateUserDto): Promise<UserEntity>

  abstract checkField(checkFieldDto: CheckFieldDto): Promise<Boolean>

}