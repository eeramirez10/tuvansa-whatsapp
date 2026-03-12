import {
  NotificationChannel,
  NotificationScope,
  QuoteNotificationEvent,
  WhatsappNotificationTemplate
} from "../../enums/notification.enum";

interface Options {
  userId: string;
  event: QuoteNotificationEvent;
  channel?: NotificationChannel;
  template?: WhatsappNotificationTemplate;
  scope?: NotificationScope;
  enabled?: boolean;
}

export class UpsertUserNotificationSettingDto {
  readonly userId: string;
  readonly event: QuoteNotificationEvent;
  readonly channel: NotificationChannel;
  readonly template: WhatsappNotificationTemplate;
  readonly scope: NotificationScope;
  readonly enabled: boolean;

  constructor(options: Options) {
    this.userId = options.userId;
    this.event = options.event;
    this.channel = options.channel ?? NotificationChannel.WHATSAPP;
    this.template = options.template ?? WhatsappNotificationTemplate.QUOTE_WEB_NOTIFICATION_ICONS;
    this.scope = options.scope ?? NotificationScope.GLOBAL;
    this.enabled = options.enabled ?? true;
  }

  static execute(values: Record<string, any>): [string?, UpsertUserNotificationSettingDto?] {
    const userId = `${values.userId ?? ''}`.trim();
    if (!userId) return ['userId es requerido'];

    const event = this.parseEnumValue<QuoteNotificationEvent>(
      values.event,
      QuoteNotificationEvent
    );
    if (!event) return ['event inválido'];

    const channel =
      this.parseEnumValue<NotificationChannel>(values.channel, NotificationChannel) ??
      NotificationChannel.WHATSAPP;

    const template =
      this.parseEnumValue<WhatsappNotificationTemplate>(
        values.template,
        WhatsappNotificationTemplate
      ) ?? WhatsappNotificationTemplate.QUOTE_WEB_NOTIFICATION_ICONS;

    const scope =
      this.parseEnumValue<NotificationScope>(
        values.scope,
        NotificationScope
      ) ?? NotificationScope.GLOBAL;

    const enabled = values.enabled === undefined
      ? true
      : values.enabled === true || `${values.enabled}`.toLowerCase() === 'true';

    return [undefined, new UpsertUserNotificationSettingDto({
      userId,
      event,
      channel,
      template,
      scope,
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
