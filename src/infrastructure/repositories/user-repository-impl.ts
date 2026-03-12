import { GetUserNotificationSettingsDto } from "../../domain/dtos/users/get-user-notification-settings.dto";
import { UsersResponseDTO } from "../../domain/dtos/users/users-response.dto";
import { UserRepository } from "../../domain/repositories/user-repository";
import { UserDatasource } from '../../domain/datasource/user.datasource';
import { InternalEmployeeResponseDto } from "../../domain/dtos/users/internal-employee-response.dto";
import { NotificationRecipientDto } from "../../domain/dtos/users/notification-recipient.dto";
import { UpsertUserNotificationSettingDto } from "../../domain/dtos/users/upsert-user-notification-setting.dto";
import { UserNotificationSettingResponseDto } from "../../domain/dtos/users/user-notification-setting-response.dto";
import { NotificationChannel, QuoteNotificationEvent } from "../../domain/enums/notification.enum";
import { UpdateUserDto } from "../../domain/dtos/users/update-user.dto";

export class UserRepositoryImpl implements UserRepository {

  constructor(private readonly userDatasource: UserDatasource) { }

  update(updateUserDto: UpdateUserDto): Promise<UsersResponseDTO> {
    return this.userDatasource.update(updateUserDto)
  }

  getNotificationRecipients(options: {
    event: QuoteNotificationEvent;
    channel?: NotificationChannel;
    quoteBranchId?: string | null;
  }): Promise<NotificationRecipientDto[]> {
    return this.userDatasource.getNotificationRecipients(options)
  }

  listNotificationSettings(
    getUserNotificationSettingsDto: GetUserNotificationSettingsDto
  ): Promise<UserNotificationSettingResponseDto[]> {
    return this.userDatasource.listNotificationSettings(getUserNotificationSettingsDto)
  }

  upsertNotificationSetting(
    upsertUserNotificationSettingDto: UpsertUserNotificationSettingDto
  ): Promise<UserNotificationSettingResponseDto> {
    return this.userDatasource.upsertNotificationSetting(upsertUserNotificationSettingDto)
  }

  findByWaID(waId: string): Promise<InternalEmployeeResponseDto | null> {
    return this.userDatasource.findByWaID(waId)
  }

  list(): Promise<UsersResponseDTO[]> {
    return this.userDatasource.list();
  }

}
