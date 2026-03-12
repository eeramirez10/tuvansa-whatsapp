import {
  NotificationChannel,
  NotificationScope,
  QuoteNotificationEvent,
  WhatsappNotificationTemplate
} from "../../enums/notification.enum";
import { UserRole } from "./internal-employee-response.dto";

interface UserSummaryOption {
  id: string;
  name: string;
  lastname: string;
  role: UserRole;
  branchId?: string | null;
  phone?: string | null;
  email: string;
}

interface Option {
  id: string;
  userId: string;
  event: QuoteNotificationEvent;
  channel: NotificationChannel;
  template: WhatsappNotificationTemplate;
  scope: NotificationScope;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: UserSummaryOption;
}

export class UserNotificationSettingResponseDto {
  readonly id: string;
  readonly userId: string;
  readonly event: QuoteNotificationEvent;
  readonly channel: NotificationChannel;
  readonly template: WhatsappNotificationTemplate;
  readonly scope: NotificationScope;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly user?: UserSummaryOption;

  constructor(options: Option) {
    this.id = options.id;
    this.userId = options.userId;
    this.event = options.event;
    this.channel = options.channel;
    this.template = options.template;
    this.scope = options.scope;
    this.enabled = options.enabled;
    this.createdAt = options.createdAt;
    this.updatedAt = options.updatedAt;
    this.user = options.user;
  }
}
