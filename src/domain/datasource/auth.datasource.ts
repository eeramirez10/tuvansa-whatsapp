import { LoginUserDto } from "../dtos/auth/login-user.dto";
import { UserEntity } from "../entities/user.entity";
import { CreateUserDto } from '../dtos/auth/create-user.dto';
import { CheckFieldDto } from '../dtos/auth/check-field.dto';


export abstract class AuthDatasource {

  abstract login(loginUserDto: LoginUserDto): Promise<UserEntity | null>

  abstract create(createUserDto: CreateUserDto): Promise<UserEntity>

  abstract checkField(checkFieldDto: CheckFieldDto): Promise<Boolean>
}