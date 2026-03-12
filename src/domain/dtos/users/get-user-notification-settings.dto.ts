import { NotificationChannel, QuoteNotificationEvent } from "../../enums/notification.enum";

interface Options {
  userId?: string;
  event?: QuoteNotificationEvent;
  channel?: NotificationChannel;
  enabled?: boolean;
}

export class GetUserNotificationSettingsDto {
  readonly userId?: string;
  readonly event?: QuoteNotificationEvent;
  readonly channel?: NotificationChannel;
  readonly enabled?: boolean;

  constructor(options: Options) {
    this.userId = options.userId;
    this.event = options.event;
    this.channel = options.channel;
    this.enabled = options.enabled;
  }

  static execute(values: Record<string, any>): [string?, GetUserNotificationSettingsDto?] {
    const userId = `${values.userId ?? ''}`.trim() || undefined;

    const event = this.parseEnumValue<QuoteNotificationEvent>(
      values.event,
      QuoteNotificationEvent
    );
    if (values.event !== undefined && !event) {
      return ['event inválido'];
    }

    const channel = this.parseEnumValue<NotificationChannel>(values.channel, NotificationChannel);
    if (values.channel !== undefined && !channel) {
      return ['channel inválido'];
    }

    const enabled = values.enabled === undefined
      ? undefined
      : values.enabled === true || `${values.enabled}`.toLowerCase() === 'true';

    return [undefined, new GetUserNotificationSettingsDto({
      userId,
      event,
      channel,
      enabled
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
