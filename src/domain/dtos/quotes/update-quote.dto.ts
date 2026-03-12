import { QuoteWorkflowStatus } from "@prisma/client";

export interface UpdateQuote {
  customerId?: string;
  fileKey?: string | null;
  summary?: string | null;
  chatThreadId?: string | null;
  workflowStatus?: QuoteWorkflowStatus;
  seenAt?: Date | null;
  downloadedAt?: Date | null;
  erpQuoteNumber?: string | null;
  erpQuoteAt?: Date | null;
  erpSystem?: string | null;
  erpInvoiceNumber?: string | null;
  invoicedAt?: Date | null;
  rejectedReason?: string | null;
  lastReminderAt?: Date | null;
  reminderCount?: number;
  workflowUpdatedAt?: Date;
  workflowUpdatedById?: string | null;
}

export class UpdateQuoteDto {
  public readonly customerId?: string;
  public readonly fileKey?: string | null;
  public readonly summary?: string | null;
  public readonly chatThreadId?: string | null;
  public readonly workflowStatus?: QuoteWorkflowStatus;
  public readonly seenAt?: Date | null;
  public readonly downloadedAt?: Date | null;
  public readonly erpQuoteNumber?: string | null;
  public readonly erpQuoteAt?: Date | null;
  public readonly erpSystem?: string | null;
  public readonly erpInvoiceNumber?: string | null;
  public readonly invoicedAt?: Date | null;
  public readonly rejectedReason?: string | null;
  public readonly lastReminderAt?: Date | null;
  public readonly reminderCount?: number;
  public readonly workflowUpdatedAt?: Date;
  public readonly workflowUpdatedById?: string | null;

  private constructor(options: UpdateQuote) {
    this.customerId = options.customerId;
    this.fileKey = options.fileKey;
    this.summary = options.summary;
    this.chatThreadId = options.chatThreadId;
    this.workflowStatus = options.workflowStatus;
    this.seenAt = options.seenAt;
    this.downloadedAt = options.downloadedAt;
    this.erpQuoteNumber = options.erpQuoteNumber;
    this.erpQuoteAt = options.erpQuoteAt;
    this.erpSystem = options.erpSystem;
    this.erpInvoiceNumber = options.erpInvoiceNumber;
    this.invoicedAt = options.invoicedAt;
    this.rejectedReason = options.rejectedReason;
    this.lastReminderAt = options.lastReminderAt;
    this.reminderCount = options.reminderCount;
    this.workflowUpdatedAt = options.workflowUpdatedAt;
    this.workflowUpdatedById = options.workflowUpdatedById;
  }

  static execute(quote: UpdateQuote): [string?, UpdateQuoteDto?] {
    const hasAnyField = Object.values(quote).some((value) => value !== undefined);
    if (!hasAnyField) {
      return ["No se ha enviado ningún campo para actualizar"];
    }

    if (quote.customerId !== undefined) {
      if (typeof quote.customerId !== "string" || quote.customerId.trim() === "") {
        return ["El customerId, de estar presente, no puede estar vacío"];
      }
    }

    if (quote.fileKey !== undefined) {
      if (quote.fileKey !== null && (typeof quote.fileKey !== "string" || quote.fileKey.trim() === "")) {
        return ["El fileKey, de estar presente, debe ser una cadena no vacía o null para desvincular"];
      }
    }

    if (quote.summary !== undefined) {
      if (quote.summary !== null && (typeof quote.summary !== "string" || quote.summary.trim() === "")) {
        return ["El summary, de estar presente, debe ser una cadena no vacía o null para limpiar"];
      }
    }

    if (quote.chatThreadId !== undefined) {
      if (quote.chatThreadId !== null && (typeof quote.chatThreadId !== "string" || quote.chatThreadId.trim() === "")) {
        return ["El chatThreadId, de estar presente, debe ser una cadena no vacía o null para desvincular"];
      }
    }

    if (quote.reminderCount !== undefined && (!Number.isInteger(quote.reminderCount) || quote.reminderCount < 0)) {
      return ['reminderCount debe ser un entero >= 0'];
    }

    return [undefined, new UpdateQuoteDto({
      customerId: quote.customerId?.trim(),
      fileKey: quote.fileKey === undefined ? undefined : (quote.fileKey === null ? null : quote.fileKey.trim()),
      summary: quote.summary === undefined ? undefined : (quote.summary === null ? null : quote.summary.trim()),
      chatThreadId: quote.chatThreadId === undefined ? undefined : (quote.chatThreadId === null ? null : quote.chatThreadId.trim()),
      workflowStatus: quote.workflowStatus,
      seenAt: quote.seenAt,
      downloadedAt: quote.downloadedAt,
      erpQuoteNumber: quote.erpQuoteNumber === undefined
        ? undefined
        : quote.erpQuoteNumber === null
          ? null
          : quote.erpQuoteNumber.trim(),
      erpQuoteAt: quote.erpQuoteAt,
      erpSystem: quote.erpSystem === undefined
        ? undefined
        : quote.erpSystem === null
          ? null
          : quote.erpSystem.trim(),
      erpInvoiceNumber: quote.erpInvoiceNumber === undefined
        ? undefined
        : quote.erpInvoiceNumber === null
          ? null
          : quote.erpInvoiceNumber.trim(),
      invoicedAt: quote.invoicedAt,
      rejectedReason: quote.rejectedReason === undefined
        ? undefined
        : quote.rejectedReason === null
          ? null
          : quote.rejectedReason.trim(),
      lastReminderAt: quote.lastReminderAt,
      reminderCount: quote.reminderCount,
      workflowUpdatedAt: quote.workflowUpdatedAt,
      workflowUpdatedById: quote.workflowUpdatedById === undefined
        ? undefined
        : quote.workflowUpdatedById === null
          ? null
          : quote.workflowUpdatedById.trim(),
    })];
  }
}
