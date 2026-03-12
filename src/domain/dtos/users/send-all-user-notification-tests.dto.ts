import { NotificationChannel } from "../../enums/notification.enum";

interface Options {
  enabledOnly?: boolean;
  channel: NotificationChannel;
}

export class SendAllUserNotificationTestsDto {
  readonly enabledOnly?: boolean;
  readonly channel: NotificationChannel;

  constructor(options: Options) {
    this.enabledOnly = options.enabledOnly;
    this.channel = options.channel;
  }

  static execute(values: Record<string, any>): [string?, SendAllUserNotificationTestsDto?] {
    const channel = this.parseEnumValue(values.channel, NotificationChannel) ?? NotificationChannel.WHATSAPP;

    const enabledOnly = values.enabledOnly === undefined
      ? true
      : values.enabledOnly === true || `${values.enabledOnly}`.toLowerCase() === 'true';

    return [undefined, new SendAllUserNotificationTestsDto({
      enabledOnly,
      channel
    })];
  }

  private static parseEnumValue<T extends string>(
    value: unknown,
    enumObj: Record<string, T>
  ): T | undefined {
    const normalized = `${value ?? ''}`.trim().toUpperCase();
    if (!normalized) return undefined;
    return Object.values(enumObj).find((item) => item === normalized as T);
  }
}
