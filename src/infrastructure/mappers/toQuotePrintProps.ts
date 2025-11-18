import { JsInputValue, JsonValue } from "@prisma/client/runtime/library";
import { QuoteVersionItemEntity } from "../../domain/entities/quote-version-item.entity";
import { QuoteVersionEntity } from "../../domain/entities/quote-version.entity";
import { QuotePrintCompany, QuotePrintTerms, QuotePrintBranding, QuotePrintProps, QuotePrintHeader, QuotePrintCustomer, QuotePrintItem, QuotePrintTotals } from "../template/pdf/types";



export function toQuotePrintProps(
  version: QuoteVersionEntity,
  items: QuoteVersionItemEntity[],
  company: QuotePrintCompany,
  terms: QuotePrintTerms,
  branding: Partial<QuotePrintBranding> = {}
): QuotePrintProps {

  const header: QuotePrintHeader = {
    folio: version.versionNumber ?? version.versionNumber, // usa tu preferencia
    versionNumber: version.versionNumber,
    status: version.status as any,
    createdAt: version.createdAt?.toISOString?.() ?? new Date().toISOString(),
    validUntil: version.validUntil ? new Date(version.validUntil).toISOString() : null,
  };

  const customer: QuotePrintCustomer = {
    name: (version.customerSnapshot?.name  ?? '').trim(),
    lastname: (version.customerSnapshot?.lastname ?? '').trim() || undefined,
    phone: (version.customerSnapshot?.phone ?? '').trim() || undefined,
    email: (version.customerSnapshot?.email ?? '').trim() || undefined,
    location: (version.customerSnapshot?.location ?? '').trim() || undefined,
    rfc: (version.customerSnapshot?.rfc ?? '').trim() || undefined,
  };

  const list: QuotePrintItem[] = items.map((it, idx) => ({
    index: idx + 1,
    description: it.description,
    ean: it.ean ?? undefined,
    codigo: it.codigo ?? undefined,
    um: it.um ?? 'UNIT',
    quantity: it.quantity ?? '0.0000',
    unitPrice: it.price ?? null,
    lineTotal: it.lineTotal ?? '0.00',
  }));

  const totals: QuotePrintTotals = {
    currency: version.currency,
    subtotal: version.subtotal ?? '0.00',
    taxRate: version.taxRate ?? '0.1600',
    taxTotal: version.taxTotal ?? '0.00',
    grandTotal: version.grandTotal ?? '0.00',
  };

  const finalBranding: QuotePrintBranding = {
    showWatermarkDraft: branding.showWatermarkDraft ?? true,
    showBorders: branding.showBorders ?? true,
  };

  return {
    header,
    company,
    customer,
    items: list,
    totals,
    terms,
    branding: finalBranding,
  };
}
