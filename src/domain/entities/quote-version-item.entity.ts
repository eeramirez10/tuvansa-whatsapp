

export type VersionStatus = 'DRAFT' | 'FINAL'
export type PriceOrigin   = 'AUTOMATIC' | 'MANUAL' | 'PROMO' | 'IMPORTED'

export interface CustomerSnapshot {
  name: string
  lastname?: string
  phone?: string            // ideal E.164
  email?: string
  location?: string
  // MX opcionales:
  rfc?: string
  razonSocial?: string
  usoCFDI?: string
  regimenFiscal?: string
  shippingAddress?: {
    street?: string
    number?: string
    postalCode?: string
    neighborhood?: string
    city?: string
    state?: string
    references?: string
  }
  [k: string]: unknown
}


export class QuoteVersionItemEntity {
  constructor(
    public readonly id: string,
    public readonly quoteVersionId: string,
    // rastros opcionales
    public readonly quoteItemId: string | null,
    public readonly uiLineId: string | null,

    // datos congelados
    public readonly description: string,
    public readonly ean: string | null,
    public readonly codigo: string | null,
    public readonly um: string,

    // cantidades / dinero (como string para no perder precisión)
    public readonly quantity: string,        // ej. "12.0000"
    public readonly cost: string | null,     // ej. "123.45"
    public readonly currency: string,
    public readonly price: string | null,    // ej. "199.99"
    public readonly marginPct: string | null,// ej. "10.00"
    public readonly lineTotal: string,       // ej. "231.99"

    // desc/iva por línea
    public readonly discountPct: string | null,
    public readonly discountAmount: string | null,
    public readonly taxRate: string | null,  // ej. "0.1600"

    // auditoría y fuente
    public readonly priceOrigin: PriceOrigin | null,
    public readonly sourceProductKey: string | null,

    // snapshots de almacén (sin FK)
    public readonly warehouse: string | null,
    public readonly binLocation: string | null,

    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}