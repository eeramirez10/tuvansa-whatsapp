import { UpsertUserNotificationSettingDto } from "../../../domain/dtos/users/upsert-user-notification-setting.dto";
import { UserRepository } from "../../../domain/repositories/user-repository";

export class UpsertUserNotificationSettingUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(upsertUserNotificationSettingDto: UpsertUserNotificationSettingDto) {
    return await this.userRepository.upsertNotificationSetting(upsertUserNotificationSettingDto)
  }
}
