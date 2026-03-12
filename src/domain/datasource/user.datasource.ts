import { GetUserNotificationSettingsDto } from "../dtos/users/get-user-notification-settings.dto";
import { InternalEmployeeResponseDto } from "../dtos/users/internal-employee-response.dto";
import { NotificationRecipientDto } from "../dtos/users/notification-recipient.dto";
import { UpsertUserNotificationSettingDto } from "../dtos/users/upsert-user-notification-setting.dto";
import { UserNotificationSettingResponseDto } from "../dtos/users/user-notification-setting-response.dto";
import { NotificationChannel, QuoteNotificationEvent } from "../enums/notification.enum";
import { UsersResponseDTO } from "../dtos/users/users-response.dto";
import { UpdateUserDto } from "../dtos/users/update-user.dto";


export abstract class UserDatasource {

  abstract list():Promise<UsersResponseDTO[]>

  abstract update(updateUserDto: UpdateUserDto): Promise<UsersResponseDTO>

  abstract findByWaID(waId:string):Promise<InternalEmployeeResponseDto | null>

  abstract listNotificationSettings(
    getUserNotificationSettingsDto: GetUserNotificationSettingsDto
  ): Promise<UserNotificationSettingResponseDto[]>

  abstract upsertNotificationSetting(
    upsertUserNotificationSettingDto: UpsertUserNotificationSettingDto
  ): Promise<UserNotificationSettingResponseDto>

  abstract getNotificationRecipients(options: {
    event: QuoteNotificationEvent
    channel?: NotificationChannel
    quoteBranchId?: string | null
  }): Promise<NotificationRecipientDto[]>
}
