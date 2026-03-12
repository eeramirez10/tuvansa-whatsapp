import { UpdateUserDto } from "../../../domain/dtos/users/update-user.dto";
import { UserRepository } from "../../../domain/repositories/user-repository";

export class UpdateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(updateUserDto: UpdateUserDto) {
    return this.userRepository.update(updateUserDto);
  }
}
