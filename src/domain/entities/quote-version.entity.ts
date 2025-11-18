import { Prisma, QuoteArtifact, VersionStatus } from "@prisma/client";
import { CustomerSnapshot, QuoteVersionItemEntity } from "./quote-version-item.entity";


type Option = {

  id: string,
  quoteId: string,
  customerId: string | null,
  versionNumber: number,
  status: VersionStatus,
  currency: string,
  taxRate: string,        // "0.1600"
  currencyRate: string | null,
  subtotal: string,
  discountTotal: string | null,
  taxTotal: string,
  grandTotal: string,
  validUntil: Date | null,
  paymentTerms: string | null,
  deliveryTime: string | null,
  notes: string | null,
  summary: string | null,
  sellerId: string | null,
  customerSnapshot: Prisma.JsonValue,
  items?: QuoteVersionItemEntity[],
  artifacts?: QuoteArtifact[],
  createdAt?: Date,
  updatedAt?: Date,
  pdfSentAt?:Date

}


export class QuoteVersionEntity {


  public readonly id: string
  public readonly quoteId: string
  public readonly customerId: string | null
  public readonly versionNumber: number
  public readonly status: VersionStatus
  public readonly currency: string
  public readonly taxRate: string        // "0.1600
  public readonly currencyRate: string | null
  public readonly subtotal: string
  public readonly discountTotal: string | null
  public readonly taxTotal: string
  public readonly grandTotal: string
  public readonly validUntil: Date | null
  public readonly paymentTerms: string | null
  public readonly deliveryTime: string | null
  public readonly notes: string | null
  public readonly summary: string | null
  public readonly sellerId: string | null
  public readonly customerSnapshot: Prisma.JsonValue
  public readonly items?: QuoteVersionItemEntity[]
  public readonly artifacts?: QuoteArtifact[]
  public readonly createdAt?: Date
  public readonly updatedAt?: Date
  public readonly pdfSentAt?: Date

  constructor(options: Option) {

    this.id = options.id
    this.quoteId = options.quoteId
    this.customerId = options.customerId
    this.versionNumber = options.versionNumber
    this.status = options.status
    this.currency = options.currency
    this.taxRate = options.taxRate
    this.currencyRate = options.currencyRate
    this.subtotal = options.subtotal
    this.discountTotal = options.discountTotal
    this.taxTotal = options.taxTotal
    this.grandTotal = options.grandTotal
    this.validUntil = options.validUntil
    this.paymentTerms = options.paymentTerms
    this.deliveryTime = options.deliveryTime
    this.notes = options.notes
    this.summary = options.summary
    this.sellerId = options.sellerId
    this.customerSnapshot = options.customerSnapshot
    this.items = options.items
    this.artifacts = options.artifacts
    this.createdAt = options.createdAt
    this.updatedAt = options.updatedAt
    this.pdfSentAt = options.pdfSentAt

  }
}