import { GetUserNotificationSettingsDto } from "../../../domain/dtos/users/get-user-notification-settings.dto";
import { UserRepository } from "../../../domain/repositories/user-repository";

export class GetUserNotificationSettingsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(getUserNotificationSettingsDto: GetUserNotificationSettingsDto) {
    return await this.userRepository.listNotificationSettings(getUserNotificationSettingsDto)
  }
}
