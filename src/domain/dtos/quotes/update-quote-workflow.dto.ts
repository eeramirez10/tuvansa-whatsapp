import { QuoteWorkflowStatus } from "@prisma/client";

type AllowedWorkflowStatus =
  | 'VIEWED'
  | 'DOWNLOADED'
  | 'IN_PROGRESS'
  | 'QUOTED'
  | 'REJECTED'
  | 'INVOICED';

interface Options {
  workflowStatus: string;
  erpQuoteNumber?: string;
  erpSystem?: string;
  erpInvoiceNumber?: string;
  rejectedReason?: string;
}

export class UpdateQuoteWorkflowDto {
  readonly workflowStatus: AllowedWorkflowStatus;
  readonly erpQuoteNumber?: string;
  readonly erpSystem?: string;
  readonly erpInvoiceNumber?: string;
  readonly rejectedReason?: string;

  private constructor(options: {
    workflowStatus: AllowedWorkflowStatus;
    erpQuoteNumber?: string;
    erpSystem?: string;
    erpInvoiceNumber?: string;
    rejectedReason?: string;
  }) {
    this.workflowStatus = options.workflowStatus;
    this.erpQuoteNumber = options.erpQuoteNumber;
    this.erpSystem = options.erpSystem;
    this.erpInvoiceNumber = options.erpInvoiceNumber;
    this.rejectedReason = options.rejectedReason;
  }

  static execute(values: Record<any, any>): [string?, UpdateQuoteWorkflowDto?] {
    const workflowStatus = String(values.workflowStatus ?? '').toUpperCase();

    const allowed = new Set<string>([
      QuoteWorkflowStatus.VIEWED,
      QuoteWorkflowStatus.DOWNLOADED,
      QuoteWorkflowStatus.IN_PROGRESS,
      QuoteWorkflowStatus.QUOTED,
      QuoteWorkflowStatus.REJECTED,
      QuoteWorkflowStatus.INVOICED
    ]);

    if (!allowed.has(workflowStatus)) {
      return ['workflowStatus inválido'];
    }

    const erpQuoteNumber = values.erpQuoteNumber !== undefined ? String(values.erpQuoteNumber).trim() : undefined;
    const erpSystem = values.erpSystem !== undefined ? String(values.erpSystem).trim() : undefined;
    const erpInvoiceNumber = values.erpInvoiceNumber !== undefined ? String(values.erpInvoiceNumber).trim() : undefined;
    const rejectedReason = values.rejectedReason !== undefined ? String(values.rejectedReason).trim() : undefined;

    if (workflowStatus === QuoteWorkflowStatus.QUOTED && !erpQuoteNumber) {
      return ['erpQuoteNumber es requerido para workflowStatus QUOTED'];
    }

    if (workflowStatus === QuoteWorkflowStatus.INVOICED && !erpInvoiceNumber) {
      return ['erpInvoiceNumber es requerido para workflowStatus INVOICED'];
    }

    return [undefined, new UpdateQuoteWorkflowDto({
      workflowStatus: workflowStatus as AllowedWorkflowStatus,
      erpQuoteNumber,
      erpSystem,
      erpInvoiceNumber,
      rejectedReason
    })];
  }
}
