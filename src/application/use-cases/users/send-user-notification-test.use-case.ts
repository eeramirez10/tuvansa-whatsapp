import { envs } from "../../../config/envs";
import { SendAllUserNotificationTestsDto } from "../../../domain/dtos/users/send-all-user-notification-tests.dto";
import { SendUserNotificationTestDto } from "../../../domain/dtos/users/send-user-notification-test.dto";
import { GetUserNotificationSettingsDto } from "../../../domain/dtos/users/get-user-notification-settings.dto";
import {
  NotificationChannel,
  WhatsappNotificationTemplate
} from "../../../domain/enums/notification.enum";
import { UserRepository } from "../../../domain/repositories/user-repository";
import { MessageService } from "../../../domain/services/message.service";
import { WhatsAppNotificationService } from "../../../infrastructure/services/whatsapp-notification.service";
import { WhatsappTemplate } from "../../../infrastructure/template/whatsapp/whatsapp-templates";
import { buildWorkflowPayload } from "../whatsApp/workflow-payload";

type NotificationTestStatus = 'SENT' | 'FAILED' | 'SKIPPED';

export interface NotificationTestResult {
  userId: string;
  userName: string;
  template: WhatsappNotificationTemplate;
  event: string;
  channel: string;
  phone?: string;
  status: NotificationTestStatus;
  message: string;
  providerMessageSid?: string;
  sentAt: string;
}

interface SendTestTarget {
  userId: string;
  userName: string;
  phone?: string | null;
  event: string;
  channel: NotificationChannel;
  template: WhatsappNotificationTemplate;
}

export class SendUserNotificationTestUseCase {
  private readonly notificationService: WhatsAppNotificationService;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly messageService: MessageService
  ) {
    this.notificationService = new WhatsAppNotificationService(this.messageService);
  }

  async execute(sendUserNotificationTestDto: SendUserNotificationTestDto): Promise<NotificationTestResult> {
    const users = await this.userRepository.list();
    const user = users.find((item) => item.id === sendUserNotificationTestDto.userId);

    if (!user) {
      return this.buildResult({
        userId: sendUserNotificationTestDto.userId,
        userName: 'Usuario no encontrado',
        phone: undefined,
        event: sendUserNotificationTestDto.event,
        channel: sendUserNotificationTestDto.channel,
        template: sendUserNotificationTestDto.template,
        status: 'FAILED',
        message: 'Usuario no encontrado'
      });
    }

    return this.sendTest({
      userId: user.id,
      userName: `${user.name} ${user.lastname}`.trim(),
      phone: user.phone,
      event: sendUserNotificationTestDto.event,
      channel: sendUserNotificationTestDto.channel,
      template: sendUserNotificationTestDto.template
    });
  }

  async executeAll(sendAllDto: SendAllUserNotificationTestsDto): Promise<{
    results: NotificationTestResult[];
    summary: { total: number; sent: number; failed: number; skipped: number };
  }> {
    const settings = await this.userRepository.listNotificationSettings(
      new GetUserNotificationSettingsDto({
        channel: sendAllDto.channel,
        enabled: sendAllDto.enabledOnly
      })
    );

    const results: NotificationTestResult[] = [];

    for (const setting of settings) {
      const userName = setting.user
        ? `${setting.user.name} ${setting.user.lastname}`.trim()
        : setting.userId;

      const result = await this.sendTest({
        userId: setting.userId,
        userName,
        phone: setting.user?.phone ?? undefined,
        event: setting.event,
        channel: setting.channel,
        template: setting.template
      });
      results.push(result);
    }

    const summary = results.reduce(
      (acc, item) => {
        if (item.status === 'SENT') acc.sent += 1;
        if (item.status === 'FAILED') acc.failed += 1;
        if (item.status === 'SKIPPED') acc.skipped += 1;
        return acc;
      },
      { total: results.length, sent: 0, failed: 0, skipped: 0 }
    );

    return { results, summary };
  }

  private async sendTest(target: SendTestTarget): Promise<NotificationTestResult> {
    if (target.channel !== NotificationChannel.WHATSAPP) {
      return this.buildResult({
        ...target,
        status: 'SKIPPED',
        message: 'Solo se permite prueba por canal WHATSAPP'
      });
    }

    const phone = `${target.phone ?? ''}`.trim();
    if (!phone) {
      return this.buildResult({
        ...target,
        phone: undefined,
        status: 'FAILED',
        message: 'El usuario no tiene teléfono configurado'
      });
    }

    try {
      const template = this.mapTemplate(target.template);
      const payload = this.buildTemplatePayload({
        to: phone,
        templateName: target.template
      });
      const response = await this.notificationService.sendTemplateMessage(template, payload);

      return this.buildResult({
        ...target,
        phone,
        status: 'SENT',
        message: `Prueba enviada con template ${target.template}`,
        providerMessageSid: response.providerMessageSid
      });
    } catch (error) {
      return this.buildResult({
        ...target,
        phone,
        status: 'FAILED',
        message: `${error instanceof Error ? error.message : 'No se pudo enviar la prueba'}`
      });
    }
  }

  private buildTemplatePayload(options: {
    to: string;
    templateName: WhatsappNotificationTemplate;
  }) {
    const now = new Date();
    const datePart = now.toISOString().replace('T', ' ').slice(0, 19);
    const quoteNumber = `TEST-${options.templateName}`;
    const baseUrl = `${envs.API_URL}/users`;
    const detailsUrl = `${baseUrl}?notificationTest=true&template=${encodeURIComponent(options.templateName)}`;
    const summary = `PRUEBA DE NOTIFICACIÓN | ${options.templateName} | ${datePart}`;

    return {
      to: options.to,
      quote: {
        summary
      },
      url: detailsUrl,
      workflow: {
        quoteNumber,
        actionView: buildWorkflowPayload('VIEW', quoteNumber),
        actionDownload: buildWorkflowPayload('DOWNLOAD', quoteNumber),
        actionAccept: buildWorkflowPayload('ACCEPT', quoteNumber),
        actionRejectNotQuote: buildWorkflowPayload('REJECTED', quoteNumber, 'No es una cotización'),
        actionRejectOutOfScope: buildWorkflowPayload('REJECTED', quoteNumber, 'No aplica'),
        actionRejectMenu: buildWorkflowPayload('REJECT_MENU', quoteNumber),
        actionRejectClientDeclined: buildWorkflowPayload('REJECTED', quoteNumber, 'Cliente rechazó la oferta'),
        actionRejectNoResponse: buildWorkflowPayload('REJECTED', quoteNumber, 'Sin respuesta del cliente'),
        actionRejectTooExpensive: buildWorkflowPayload('REJECTED', quoteNumber, 'Precio fuera de presupuesto'),
        actionQuoted: buildWorkflowPayload('QUOTED', quoteNumber)
      }
    };
  }

  private buildResult(options: {
    userId: string;
    userName: string;
    phone?: string;
    event: string;
    channel: string;
    template: WhatsappNotificationTemplate;
    status: NotificationTestStatus;
    message: string;
    providerMessageSid?: string;
  }): NotificationTestResult {
    return {
      userId: options.userId,
      userName: options.userName,
      phone: options.phone,
      event: options.event,
      channel: options.channel,
      template: options.template,
      status: options.status,
      message: options.message,
      providerMessageSid: options.providerMessageSid,
      sentAt: new Date().toISOString()
    };
  }

  private mapTemplate(template: WhatsappNotificationTemplate): WhatsappTemplate {
    switch (template) {
      case WhatsappNotificationTemplate.QUOTE_WEB_NOTIFICATION:
        return WhatsappTemplate.QUOTE_WEB_NOTIFICATION;
      case WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_NEW:
        return WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_NEW;
      case WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_VIEWED:
        return WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_VIEWED;
      case WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_AFTER_DOWNLOAD:
        return WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_AFTER_DOWNLOAD;
      case WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_REMINDER_PENDING_ERP:
        return WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_REMINDER_PENDING_ERP;
      case WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_REJECT_REASON_PENDING_ERP:
        return WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_REJECT_REASON_PENDING_ERP;
      case WhatsappNotificationTemplate.QUOTE_WEB_NOTIFICATION_ICONS:
      default:
        return WhatsappTemplate.QUOTE_WEB_NOTIFICATION_ICONS;
    }
  }
}
