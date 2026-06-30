import { DeleteUserNotificationSettingDto } from "../../../domain/dtos/users/delete-user-notification-setting.dto";
import { UserRepository } from "../../../domain/repositories/user-repository";

export class DeleteUserNotificationSettingUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(deleteUserNotificationSettingDto: DeleteUserNotificationSettingDto) {
    return await this.userRepository.deleteNotificationSetting(deleteUserNotificationSettingDto)
  }
}
