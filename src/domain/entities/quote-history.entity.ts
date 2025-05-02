import { $Enums, QuoteHistory } from "@prisma/client"
import { JsonValue } from "@prisma/client/runtime/library"

interface QuoteEntityOptions {
  id: string
  oldStatus: $Enums.QuoteStatus
  newStatus: $Enums.QuoteStatus
  changedAt: Date
  userId: string
  quoteId: string
  snapshot: JsonValue
}


export class QuoteHistoryEntity implements QuoteHistory {
  id: string
  oldStatus: $Enums.QuoteStatus
  newStatus: $Enums.QuoteStatus
  changedAt: Date
  userId: string
  quoteId: string
  snapshot: JsonValue

  constructor(options: QuoteEntityOptions) {
    this.id = options.id
    this.oldStatus = options.oldStatus
    this.newStatus = options.newStatus
    this.changedAt = options.changedAt
    this.userId = options.userId
    this.quoteId = options.quoteId
    this.snapshot = options.snapshot
  }


}