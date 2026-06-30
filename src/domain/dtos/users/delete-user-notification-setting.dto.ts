interface Options {
  settingId: string;
}

export class DeleteUserNotificationSettingDto {
  readonly settingId: string;

  constructor(options: Options) {
    this.settingId = options.settingId;
  }

  static execute(values: Record<string, any>): [string?, DeleteUserNotificationSettingDto?] {
    const settingId = `${values.settingId ?? ''}`.trim();
    if (!settingId) return ['settingId es requerido'];

    return [undefined, new DeleteUserNotificationSettingDto({ settingId })];
  }
}
