import {
  NotificationChannel,
  NotificationScope,
  QuoteNotificationEvent,
  WhatsappNotificationTemplate
} from "../../enums/notification.enum";
import { UserRole } from "./internal-employee-response.dto";

interface Option {
  userId: string;
  name: string;
  lastname: string;
  role: UserRole;
  branchId?: string | null;
  branchIds?: string[];
  phone: string;
  email: string;
  event: QuoteNotificationEvent;
  channel: NotificationChannel;
  template: WhatsappNotificationTemplate;
  scope: NotificationScope;
}

export class NotificationRecipientDto {
  readonly userId: string;
  readonly name: string;
  readonly lastname: string;
  readonly role: UserRole;
  readonly branchId?: string | null;
  readonly branchIds: string[];
  readonly phone: string;
  readonly email: string;
  readonly event: QuoteNotificationEvent;
  readonly channel: NotificationChannel;
  readonly template: WhatsappNotificationTemplate;
  readonly scope: NotificationScope;

  constructor(options: Option) {
    this.userId = options.userId;
    this.name = options.name;
    this.lastname = options.lastname;
    this.role = options.role;
    this.branchId = options.branchId;
    this.branchIds = options.branchIds ?? [];
    this.phone = options.phone;
    this.email = options.email;
    this.event = options.event;
    this.channel = options.channel;
    this.template = options.template;
    this.scope = options.scope;
  }
}
