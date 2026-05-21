import { VersionStatus } from "@prisma/client";
import { QuoteVersionEntity } from "../../../domain/entities/quote-version.entity";
import { toStr } from "../../utils/decimals";
import { QuoteVersionItemEntity } from "../../../domain/entities/quote-version-item.entity";


export class QuoteVersionMapper {

  static entityToQuote(value: Record<any, never>): QuoteVersionEntity {

    return new QuoteVersionEntity({
      id: value.id,
      quoteId: value.quoteId,
      customerId: value.customerId,
      versionNumber: value.versionNumber,
      status: value.status,
      currency: value.currency,
      taxRate: value.taxRate,
      currencyRate: value.currencyRate,
      subtotal: value.subtotal,
      discountTotal: value.discountTotal,
      taxTotal: value.taxTotal,
      grandTotal: value.grandTotal,
      validUntil: value.validUntil,
      paymentTerms: value.paymentTerms,
      deliveryTime: value.deliveryTime,
      notes: value.notes,
      summary: value.summary,
      sellerId: value.sellerId,
      customerSnapshot: value.customerSnapshot,
      items: undefined,
      artifacts: value.artifacts,
      createdAt: value.createdAt,
      updatedAt: value.updatedAt,
    })
  }

  static entityToQuoteItem = (i: Record<any, never>): QuoteVersionItemEntity => {
    return new QuoteVersionItemEntity(
      i.id,
      i.quoteVersionId,
      i.quoteItemId ?? null,
      i.uiLineId ?? null,
      i.description,
      i.ean ?? null,
      i.codigo ?? null,
      i.um,
      toStr(i.quantity)!,
      toStr(i.cost),
      i.currency,
      toStr(i.price),
      toStr(i.marginPct),
      toStr(i.lineTotal)!,
      toStr(i.discountPct),
      toStr(i.discountAmount),
      toStr(i.taxRate),
      i.priceOrigin ?? null,
      i.sourceProductKey ?? null,
      i.warehouse ?? null,
      i.binLocation ?? null,
      i.createdAt,
      i.updatedAt,
    )
  }
}