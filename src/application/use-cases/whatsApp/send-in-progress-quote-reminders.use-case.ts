import { envs } from "../../../config/envs";
import { UpdateQuoteDto } from "../../../domain/dtos/quotes/update-quote.dto";
import { QuoteRepository } from "../../../domain/repositories/quote.repository";
import { UserRepository } from "../../../domain/repositories/user-repository";
import { MessageService } from "../../../domain/services/message.service";
import { WhatsAppNotificationService } from "../../../infrastructure/services/whatsapp-notification.service";
import { WhatsappTemplate } from "../../../infrastructure/template/whatsapp/whatsapp-templates";
import { buildWorkflowPayload } from "./workflow-payload";

interface SendInProgressQuoteRemindersResult {
  due: number
  sent: number
  failed: number
  skipped: number
}

interface SendImmediateReminderResult {
  sent: boolean
  skippedReason?: string
}

interface SendInProgressQuoteRemindersOptions {
  now?: Date
  limit?: number
}

export class SendInProgressQuoteRemindersUseCase {
  private readonly notificationService: WhatsAppNotificationService

  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly userRepository: UserRepository,
    private readonly messageService: MessageService,
    private readonly reminderIntervalMs: number = 3 * 60 * 60 * 1000
  ) {
    this.notificationService = new WhatsAppNotificationService(this.messageService)
  }

  async execute(options?: SendInProgressQuoteRemindersOptions): Promise<SendInProgressQuoteRemindersResult> {
    const now = options?.now ?? new Date()
    const beforeDate = new Date(now.getTime() - this.reminderIntervalMs)
    const dueQuotes = await this.quoteRepository.findQuotesPendingReminder({
      beforeDate,
      limit: options?.limit ?? 100
    })

    if (!dueQuotes.length) {
      return {
        due: 0,
        sent: 0,
        failed: 0,
        skipped: 0
      }
    }

    const users = await this.userRepository.list()
    const usersById = new Map(users.map((user) => [user.id, user]))

    let sent = 0
    let failed = 0
    let skipped = 0

    for (const quote of dueQuotes) {
      const ownerUserId = `${quote.workflowUpdatedById ?? ''}`.trim()
      if (!ownerUserId) {
        skipped += 1
        continue
      }

      const owner = usersById.get(ownerUserId)
      const ownerPhone = `${owner?.phone ?? ''}`.trim()
      if (!owner || !owner.isActive || !ownerPhone) {
        skipped += 1
        continue
      }

      const reminderSent = await this.sendReminder({
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        to: ownerPhone
      })

      if (!reminderSent) {
        failed += 1
        continue
      }

      const [error, dto] = UpdateQuoteDto.execute({
        lastReminderAt: now,
        reminderCount: (quote.reminderCount ?? 0) + 1
      })

      if (error || !dto) {
        failed += 1
        continue
      }

      await this.quoteRepository.updateQuote(quote.id, dto)
      sent += 1
    }

    return {
      due: dueQuotes.length,
      sent,
      failed,
      skipped
    }
  }

  async executeImmediateForQuote(options: {
    quoteId: string
    ownerUserId?: string | null
    now?: Date
  }): Promise<SendImmediateReminderResult> {
    const now = options.now ?? new Date()
    const quote = await this.quoteRepository.getQuote(options.quoteId)
    if (!quote) {
      return { sent: false, skippedReason: 'quote_not_found' }
    }

    if (`${quote.workflowStatus ?? ''}` !== 'IN_PROGRESS') {
      return { sent: false, skippedReason: 'quote_not_in_progress' }
    }

    const ownerUserId = `${options.ownerUserId ?? quote.workflowUpdatedById ?? ''}`.trim()
    if (!ownerUserId) {
      return { sent: false, skippedReason: 'owner_missing' }
    }

    const users = await this.userRepository.list()
    const owner = users.find((user) => user.id === ownerUserId)
    const ownerPhone = `${owner?.phone ?? ''}`.trim()
    if (!owner || !owner.isActive || !ownerPhone) {
      return { sent: false, skippedReason: 'owner_without_phone' }
    }

    const reminderSent = await this.sendReminder({
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      to: ownerPhone
    })

    if (!reminderSent) {
      return { sent: false, skippedReason: 'send_failed' }
    }

    const [error, dto] = UpdateQuoteDto.execute({
      lastReminderAt: now,
      reminderCount: (quote.reminderCount ?? 0) + 1
    })

    if (error || !dto) {
      return { sent: false, skippedReason: 'update_failed' }
    }

    await this.quoteRepository.updateQuote(quote.id, dto)
    return { sent: true }
  }

  private async sendReminder(options: {
    quoteId: string
    quoteNumber: number
    to: string
  }): Promise<boolean> {
    const quoteUrl = `${envs.API_URL}/quotes/${options.quoteId}`

    try {
      await this.notificationService.sendTemplateMessage(
        WhatsappTemplate.QUOTE_WORKFLOW_MANAGER_REMINDER_PENDING_ERP,
        {
          to: options.to,
          quote: {
            summary: `Cotización en progreso para seguimiento ERP`
          },
          url: quoteUrl,
          workflow: {
            quoteNumber: options.quoteNumber,
            actionQuoted: buildWorkflowPayload('QUOTED', options.quoteNumber),
            actionRejectMenu: buildWorkflowPayload('REJECT_MENU', options.quoteNumber)
          }
        }
      )
      return true
    } catch (error) {
      try {
        await this.messageService.createWhatsAppMessage({
          to: options.to,
          body: `Recordatorio COT-${options.quoteNumber}: ¿ya está cotizada? Si ya tienes el número ERP, captura el estado en el sistema. ${quoteUrl}`
        })
        return true
      } catch (fallbackError) {
        return false
      }
    }
  }
}
