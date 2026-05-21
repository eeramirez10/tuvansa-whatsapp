import { UserRepository } from "../../../domain/repositories/user-repository";

export class GetInProgressReminderConfigUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute() {
    return await this.userRepository.getInProgressReminderConfig()
  }
}
