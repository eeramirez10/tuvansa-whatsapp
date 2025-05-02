import { JwtAdapter } from "../../../config/jwt";
import { CreateUserDto } from "../../../domain/dtos/auth/create-user.dto";
import { CustomError } from "../../../domain/errors/custom-error";
import { AuthRepository } from "../../../domain/repositories/auth.repository";


export class RegisterUserUseCase {


  constructor(
    private readonly authRepository: AuthRepository,
    private readonly signToken: (payload: Object, duration?: string) => Promise<string | null> = JwtAdapter.generateToken
  ) { }


  async execute(createUserDto: CreateUserDto) {


    const { id, password, ...rest } = await this.authRepository.create(createUserDto)

    const token = await this.signToken({ id })

    if (!token) throw CustomError.internalServer('Error generating token');

    return {
      token,
      user: {
        id,
        ...rest
      }

    }




  }

}