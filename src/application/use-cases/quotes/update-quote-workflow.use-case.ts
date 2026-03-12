import { QuoteWorkflowStatus } from "@prisma/client";
import { UpdateQuoteDto } from "../../../domain/dtos/quotes/update-quote.dto";
import { UpdateQuoteWorkflowDto } from "../../../domain/dtos/quotes/update-quote-workflow.dto";
import { QuoteRepository } from "../../../domain/repositories/quote.repository";

export class UpdateQuoteWorkflowUseCase {
  constructor(private readonly quoteRepository: QuoteRepository) { }

  async execute(quoteId: string, dto: UpdateQuoteWorkflowDto, userId?: string) {
    const now = new Date();

    const payload = this.buildPayload(dto, now, userId);
    const [error, updateQuoteDto] = UpdateQuoteDto.execute(payload);

    if (error || !updateQuoteDto) {
      throw new Error(error ?? 'No se pudo construir el payload de actualización');
    }

    return this.quoteRepository.updateQuote(quoteId, updateQuoteDto);
  }

  private buildPayload(dto: UpdateQuoteWorkflowDto, now: Date, userId?: string) {
    const base = {
      workflowStatus: dto.workflowStatus,
      workflowUpdatedAt: now,
      workflowUpdatedById: userId ?? null,
    };

    switch (dto.workflowStatus) {
      case QuoteWorkflowStatus.VIEWED:
        return {
          ...base,
          seenAt: now
        };
      case QuoteWorkflowStatus.DOWNLOADED:
        return {
          ...base,
          downloadedAt: now
        };
      case QuoteWorkflowStatus.IN_PROGRESS:
        return {
          ...base,
          lastReminderAt: null,
          reminderCount: 0
        };
      case QuoteWorkflowStatus.QUOTED:
        return {
          ...base,
          erpQuoteNumber: dto.erpQuoteNumber!,
          erpQuoteAt: now,
          erpSystem: dto.erpSystem ?? 'PROSCAI'
        };
      case QuoteWorkflowStatus.REJECTED:
        return {
          ...base,
          rejectedReason: dto.rejectedReason ?? null
        };
      case QuoteWorkflowStatus.INVOICED:
        return {
          ...base,
          erpInvoiceNumber: dto.erpInvoiceNumber!,
          invoicedAt: now
        };
      default:
        return base;
    }
  }
}
