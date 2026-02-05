import { QuoteVersionItemEntity } from "../../../domain/entities/quote-version-item.entity";
import { QuoteVersionEntity } from "../../../domain/entities/quote-version.entity";
import { QuoteEntity } from "../../../domain/entities/quote.entity";
import { PdfRenderer } from "../../../domain/ports/pdf-renderer";
import { QuotePrintProps } from "../pdf/types";
import { htmlToPdf } from "./htmlToPdf";
import { renderQuoteHTML } from "./render-quote-html";


type CompanyDefaults = {
  name: string;
  logoUrl?: string;
  addressLines: string[];
  phone?: string;
  website?: string;
};

type TermsDefaults = {
  formCode?: string;
  agentName?: string;
};

type BrandingDefaults = {
  showBorders?: boolean;
};

export class ReactPuppeteerPdfRenderer implements PdfRenderer {
  constructor(
    private readonly company: CompanyDefaults,
    private readonly terms: TermsDefaults = {},
    private readonly branding: BrandingDefaults = { showBorders: true }
  ) { }

  async renderQuoteVersion(
    version: QuoteVersionEntity,
    items: QuoteVersionItemEntity[],
    quote: QuoteEntity,
    opts?: { watermarkDraft?: boolean }
  ): Promise<Uint8Array<ArrayBufferLike>> {
    const props = this.mapToProps(version, items, quote, !!opts?.watermarkDraft);
    const html = renderQuoteHTML(props);
    // Si quieres más nitidez, ajusta scale dentro de htmlToPdf o crea una variante con opciones
    const pdf = await htmlToPdf(html);
    return pdf;
  }

  private mapToProps(
    v: QuoteVersionEntity,
    items: QuoteVersionItemEntity[],
    quote: QuoteEntity,
    watermarkDraft: boolean
  ): QuotePrintProps {
    const subtotal = Number(v.subtotal ?? 0);
    const taxTotal = Number(v.taxTotal ?? subtotal * Number(v.taxRate ?? 0));
    const grandTotal = Number(v.grandTotal ?? subtotal + taxTotal);

    return {
      header: {
        folio: quote.quoteNumber ?? 0,
        versionNumber: v.versionNumber,
        status: v.status, // 'DRAFT' | 'FINAL'
        createdAt: v.createdAt.toISOString(),
        validUntil: v.validUntil ? v.validUntil.toISOString() : null,
      },
      company: {
        name: this.company.name,
        logoUrl: this.company.logoUrl,
        addressLines: this.company.addressLines,
        phone: this.company.phone,
        website: this.company.website,
      },
      customer: {
        name: (v.customerSnapshot?.name) ?? '',
        lastname: v.customerSnapshot?.lastname ?? '',
        phone: v.customerSnapshot?.phone ?? '',
        email: v.customerSnapshot?.email ?? '',
        location: v.customerSnapshot?.location ?? '',
        rfc: v.customerSnapshot?.rfc ?? undefined,
      },
      items: items.map((it, idx) => ({
        index: idx + 1,
        description: it.description,
        ean: it.ean ?? '',
        codigo: it.codigo ?? '',
        um: it.um ?? 'UNIT',
        quantity: this.numToStr(+it.quantity),
        unitPrice: this.numToStr(it.price ? +it.price : 0),
        lineTotal: this.numToStr(!it.lineTotal ?  ((it.price ? +it.price : 0) * +it.quantity) : +it.lineTotal ),
      })),
      totals: {
        currency: v.currency ?? 'MXN',
        subtotal: this.numToStr(subtotal),
        taxRate: this.numToStr(v.taxRate ? +v.taxRate : 0.16),
        taxTotal: this.numToStr(taxTotal),
        grandTotal: this.numToStr(grandTotal),
      },
      terms: {
        paymentTerms: v.paymentTerms ?? 'Contado',
        deliveryTime: v.deliveryTime ?? '3 a 5 días hábiles',
        notes: v.notes ?? 'Material sujeto a disponibilidad.',
        agentName: this.terms.agentName ?? 'Nombre Agente',
        formCode: this.terms.formCode ?? 'TF-VT-01',
      },
      branding: {
        showWatermarkDraft: watermarkDraft || v.status === 'DRAFT',
        showBorders: this.branding.showBorders ?? true,
      },
    };
  }

  private numToStr(n: number): string {
    // evita notación científica y asegúrate de dos decimales para moneda
    return (Math.round(n * 100) / 100).toFixed(2);
  }
}