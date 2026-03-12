import { CustomerEntity } from "./customer-entity";
import { QuoteItemEntity } from "./quote-item.entity";
import { MessageEntity } from "./message.entity";
import { ChatThreadEntity } from "./chat-thread.entity";
import { QuoteWorkflowStatus } from "@prisma/client";


interface QuoteOptions {
  id: string;
  createdAt: Date;
  quoteNumber: number;
  customerId: string;
  items?: QuoteItemEntity[];
  customer?: CustomerEntity;
  fileKey?: string
  summary?: string
  chatThread?: ChatThreadEntity
  branchId?: string
  workflowStatus?: QuoteWorkflowStatus
  seenAt?: Date | null
  downloadedAt?: Date | null
  erpQuoteNumber?: string | null
  erpQuoteAt?: Date | null
  erpSystem?: string | null
  erpInvoiceNumber?: string | null
  invoicedAt?: Date | null
  rejectedReason?: string | null
  lastReminderAt?: Date | null
  reminderCount?: number
  workflowUpdatedAt?: Date
  workflowUpdatedById?: string | null
}



export class QuoteEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly quoteNumber: number;
  readonly customerId: string;
  readonly items?: QuoteItemEntity[];
  readonly customer?: CustomerEntity;
  readonly fileKey?: string
  readonly chatThread?: ChatThreadEntity
  readonly summary?: string
  readonly branchId?: string
  readonly workflowStatus?: QuoteWorkflowStatus
  readonly seenAt?: Date | null
  readonly downloadedAt?: Date | null
  readonly erpQuoteNumber?: string | null
  readonly erpQuoteAt?: Date | null
  readonly erpSystem?: string | null
  readonly erpInvoiceNumber?: string | null
  readonly invoicedAt?: Date | null
  readonly rejectedReason?: string | null
  readonly lastReminderAt?: Date | null
  readonly reminderCount?: number
  readonly workflowUpdatedAt?: Date
  readonly workflowUpdatedById?: string | null

  constructor(options: QuoteOptions) {
    this.id = options.id;
    this.createdAt = options.createdAt;
    this.quoteNumber = options.quoteNumber;
    this.customerId = options.customerId;
    this.items = options.items;
    this.customer = options.customer;
    this.chatThread = options.chatThread
    this.summary = options.summary
    this.branchId = options.branchId
    this.workflowStatus = options.workflowStatus
    this.seenAt = options.seenAt
    this.downloadedAt = options.downloadedAt
    this.erpQuoteNumber = options.erpQuoteNumber
    this.erpQuoteAt = options.erpQuoteAt
    this.erpSystem = options.erpSystem
    this.erpInvoiceNumber = options.erpInvoiceNumber
    this.invoicedAt = options.invoicedAt
    this.rejectedReason = options.rejectedReason
    this.lastReminderAt = options.lastReminderAt
    this.reminderCount = options.reminderCount
    this.workflowUpdatedAt = options.workflowUpdatedAt
    this.workflowUpdatedById = options.workflowUpdatedById
  }
}
