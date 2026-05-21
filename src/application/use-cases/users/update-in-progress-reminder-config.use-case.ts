import { UpdateInProgressReminderConfigDto } from "../../../domain/dtos/users/update-in-progress-reminder-config.dto";
import { UserRepository } from "../../../domain/repositories/user-repository";

export class UpdateInProgressReminderConfigUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(updateInProgressReminderConfigDto: UpdateInProgressReminderConfigDto) {
    return await this.userRepository.updateInProgressReminderConfig(updateInProgressReminderConfigDto.enabled)
  }
}
