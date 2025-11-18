import { QuoteVersionItemEntity } from "../../../domain/entities/quote-version-item.entity"
import { toStr } from "../../utils/decimals"

export class QuoteVersionItemMapper {

  static jsonToEntity = (json: Record<any, never>): QuoteVersionItemEntity => {

    return {
      id: json.id,
      quoteVersionId: json.quoteVersionId,
      quoteItemId: json.quoteItemId ?? null,
      uiLineId: json.uiLineId ?? null,
      description: json.description,
      ean: json.ean ?? null,
      codigo: json.codigo ?? null,
      um: json.um,
      quantity: toStr(json.quantity)!,
      cost: toStr(json.cost),
      currency: json.currency,
      price: toStr(json.price),
      marginPct: toStr(json.marginPct),
      lineTotal: toStr(json.lineTotal)!,
      discountPct: toStr(json.discountPct),
      discountAmount: toStr(json.discountAmount),
      taxRate: toStr(json.taxRate),
      priceOrigin: json.priceOrigin ?? null,
      sourceProductKey: json.sourceProductKey ?? null,
      warehouse: json.warehouse ?? null,
      binLocation: json.binLocation ?? null,
      createdAt: json.createdAt,
      updatedAt: json.updatedAt,
    }
  }
}