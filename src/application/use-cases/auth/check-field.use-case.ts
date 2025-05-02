import { AuthRepository } from "../../../domain/repositories/auth.repository";
import { CheckFieldDto } from '../../../domain/dtos/auth/check-field.dto';


export class CheckFieldUseCase {

  constructor(private readonly authRepository: AuthRepository) {

  }
  async execute(checkFieldDto: CheckFieldDto) {

    return this.authRepository.checkField(checkFieldDto)

  }
}