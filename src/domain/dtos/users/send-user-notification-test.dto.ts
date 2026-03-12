import {
  NotificationChannel,
  QuoteNotificationEvent,
  WhatsappNotificationTemplate
} from "../../enums/notification.enum";

interface Options {
  userId: string;
  event: QuoteNotificationEvent;
  channel: NotificationChannel;
  template: WhatsappNotificationTemplate;
}

export class SendUserNotificationTestDto {
  readonly userId: string;
  readonly event: QuoteNotificationEvent;
  readonly channel: NotificationChannel;
  readonly template: WhatsappNotificationTemplate;

  constructor(options: Options) {
    this.userId = options.userId;
    this.event = options.event;
    this.channel = options.channel;
    this.template = options.template;
  }

  static execute(values: Record<string, any>): [string?, SendUserNotificationTestDto?] {
    const userId = `${values.userId ?? ''}`.trim();
    if (!userId) return ['userId es requerido'];

    const event = this.parseEnumValue(values.event, QuoteNotificationEvent);
    if (!event) return ['event inválido'];

    const channel = this.parseEnumValue(values.channel, NotificationChannel) ?? NotificationChannel.WHATSAPP;
    const template = this.parseEnumValue(values.template, WhatsappNotificationTemplate)
      ?? WhatsappNotificationTemplate.QUOTE_WEB_NOTIFICATION_ICONS;

    return [undefined, new SendUserNotificationTestDto({
      userId,
      event,
      channel,
      template
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
