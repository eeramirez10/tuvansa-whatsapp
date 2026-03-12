import {
  NotificationChannel,
  QuoteNotificationEvent,
  WhatsappNotificationTemplate
} from "../../../domain/enums/notification.enum";
import { envs } from "../../../config/envs";
import { QuoteEntity } from "../../../domain/entities/quote.entity";
import { UserRepository } from "../../../domain/repositories/user-repository";
import { MessageService } from "../../../domain/services/message.service";
import { WhatsAppNotificationService } from "../../../infrastructure/services/whatsapp-notification.service";
import { WhatsappTemplate } from "../../../infrastructure/template/whatsapp/whatsapp-templates";
import { buildWorkflowPayload } from "./workflow-payload";
import { UserRole } from "../../../domain/dtos/users/internal-employee-response.dto";

interface DispatchQuoteNotificationsOptions {
  event: QuoteNotificationEvent;
  quote: QuoteEntity;
  summary?: string;
  actorUserId?: string;
  actorLabel?: string;
}

export class DispatchQuoteNotificationsUseCase {
  private readonly notificationService: WhatsAppNotificationService;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly messageService: MessageService
  ) {
    this.notificationService = new WhatsAppNotificationService(this.messageService);
  }

  async execute(options: DispatchQuoteNotificationsOptions): Promise<{ sent: number; failed: number }> {
    const {
      event,
      quote,
      actorUserId,
      actorLabel
    } = options;

    const recipients = await this.userRepository.getNotificationRecipients({
      event,
      channel: NotificationChannel.WHATSAPP,
      quoteBranchId: quote.branchId
    });

    const filteredRecipients = recipients.filter((recipient) => recipient.userId !== actorUserId);

    if (!filteredRecipients.length) return { sent: 0, failed: 0 };

    const quoteUrl = `${envs.API_URL}/quotes/${quote.id}`;
    const detailedSummary = (options.summary ?? quote.summary ?? '').trim() || this.buildQuoteSummary(quote);
    const workflowLabel = this.getWorkflowLabel(event);
    const branchName = this.getBranchName(quote);

    let sent = 0;
    let failed = 0;

    for (const recipient of filteredRecipients) {
      const template = this.resolveTemplateForRecipient(recipient.template, recipient.role);
      const summary = this.buildRecipientSummary({
        role: recipient.role,
        event,
        detailedSummary,
        workflowLabel,
        branchName
      });
      const fallbackText = this.buildFallbackText({
        quoteNumber: quote.quoteNumber,
        summary,
        quoteUrl,
        actorLabel
      });

      try {
        await this.notificationService.sendTemplateMessage(
          template,
          {
            to: recipient.phone,
            quote: { summary },
            url: quoteUrl,
            workflow: {
              quoteNumber: quote.quoteNumber,
              actionView: buildWorkflowPayload('VIEW', quote.quoteNumber),
              actionDownload: buildWorkflowPayload('DOWNLOAD', quote.quoteNumber),
              actionAccept: buildWorkflowPayload('ACCEPT', quote.quoteNumber),
              actionRejectNotQuote: buildWorkflowPayload('REJECTED', quote.quoteNumber, 'No es una cotización'),
              actionRejectOutOfScope: buildWorkflowPayload('REJECTED', quote.quoteNumber, 'No aplica'),
              actionRejectMenu: buildWorkflowPayload('REJECT_MENU', quote.quoteNumber),
              actionRejectClientDeclined: buildWorkflowPayload('REJECTED', quote.quoteNumber, 'Cliente rechazó la oferta'),
              actionRejectNoResponse: buildWorkflowPayload('REJECTED', quote.quoteNumber, 'Sin respuesta del cliente'),
              actionRejectTooExpensive: buildWorkflowPayload('REJECTED', quote.quoteNumber, 'Precio fuera de presupuesto'),
              actionQuoted: buildWorkflowPayload('QUOTED', quote.quoteNumber)
            }
          }
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        await this.messageService.createWhatsAppMessage({
          to: recipient.phone,
          body: fallbackText
        });
      }
    }

    return { sent, failed };
  }

  private getBranchName(quote: QuoteEntity): string {
    const branchName = `${(quote as unknown as { branch?: { name?: string | null } })?.branch?.name ?? ''}`.trim()
    return branchName || 'Sin sucursal'
  }

  private buildRecipientSummary(options: {
    role: UserRole;
    event: QuoteNotificationEvent;
    detailedSummary: string;
    workflowLabel: string;
    branchName: string;
  }): string {
    if (options.role === UserRole.ADMIN) {
      return `${options.workflowLabel}: ${options.detailedSummary}`
    }

    if (options.event === QuoteNotificationEvent.QUOTE_CREATED) {
      return `Nueva cotización para la sucursal ${options.branchName}. Da clic en el link para ver detalle.`
    }

    return `${options.workflowLabel} para la sucursal ${options.branchName}. Da clic en el link para ver detalle.`
  }

  private buildQuoteSummary(quote: QuoteEntity): string {
    const customerName = [quote.customer?.name, quote.customer?.lastname]
      .filter(Boolean)
      .join(' ')
      .trim() || 'Cliente sin nombre';

    const items = quote.items ?? [];
    if (!items.length) {
      return `COT-${quote.quoteNumber} de ${customerName} (sin items).`;
    }

    const preview = items
      .slice(0, 3)
      .map((item) => `${item.description} x${item.quantity}`)
      .join(' | ');

    const suffix = items.length > 3 ? ' | ...' : '';
    return `COT-${quote.quoteNumber} de ${customerName}. ${items.length} items (${preview}${suffix}).`;
  }

  private buildFallbackText(options: {
    quoteNumber: number;
    summary: string;
    quoteUrl: string;
    actorLabel?: string;
  }): string {
    const actorText = options.actorLabel ? ` por ${options.actorLabel}` : '';
    return `COT-${options.quoteNumber}${actorText}. ${options.summary} Ver detalle: ${options.quoteUrl}`;
  }

  private getWorkflowLabel(event: QuoteNotificationEvent): string {
    const labels: Record<QuoteNotificationEvent, string> = {
      [QuoteNotificationEvent.QUOTE_CREATED]: 'Nueva cotización',
      [QuoteNotificationEvent.QUOTE_VIEWED]: 'Cotización vista',
      [QuoteNotificationEvent.QUOTE_DOWNLOADED]: 'Cotización descargada',
      [QuoteNotificationEvent.QUOTE_IN_PROGRESS]: 'Cotización en progreso',
      [QuoteNotificationEvent.QUOTE_QUOTED]: 'Cotización registrada en ERP',
      [QuoteNotificationEvent.QUOTE_REJECTED]: 'Cotización rechazada',
      [QuoteNotificationEvent.QUOTE_INVOICED]: 'Cotización facturada'
    };
    return labels[event];
  }

  private resolveTemplateForRecipient(
    configuredTemplate: WhatsappNotificationTemplate,
    role: UserRole
  ): WhatsappTemplate {
    const interactiveTemplates = new Set<WhatsappNotificationTemplate>([
      WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_NEW,
      WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_VIEWED,
      WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_AFTER_DOWNLOAD,
      WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_REMINDER_PENDING_ERP,
      WhatsappNotificationTemplate.QUOTE_WORKFLOW_MANAGER_REJECT_REASON_PENDING_ERP
    ]);

    const canManageWorkflow = role === UserRole.ADMIN || role === UserRole.BRANCH_MANAGER;
    const safeTemplate = !canManageWorkflow && interactiveTemplates.has(configuredTemplate)
      ? WhatsappNotificationTemplate.QUOTE_WEB_NOTIFICATION_ICONS
      : configuredTemplate;

    return this.mapTemplate(safeTemplate);
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
