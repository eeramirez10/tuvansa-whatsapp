import { AuthRepository } from '../../../domain/repositories/auth.repository';
import { LoginUserDto } from '../../../domain/dtos/auth/login-user.dto';
import { JwtAdapter } from '../../../config/jwt';
import { CustomError } from '../../../domain/errors/custom-error';


export class LoginUserUseCase {

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly signToken: (payload: Object, duration?: string) => Promise<string | null> = JwtAdapter.generateToken
  ) { }


  async execute(loginUserDto: LoginUserDto) {

    const { id, password, ...rest } = await this.authRepository.login(loginUserDto)

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