// Payload que envía tu frontend al pulsar “Guardar borrador”
export type SaveDraftItemDto = {
  id: string
  uiLineId?: string;
  description: string;
  ean?: string;
  codigo?: string;
  um?: string;

  quantity: string;           // Decimal como string ("12.0000")
  cost?: string | null;
  currency: string;
  price?: string | null;
  marginPct?: string | null;
  discountPct?: string | null;
  discountAmount?: string | null;
  taxRate?: string | null;

  priceOrigin?: 'AUTOMATIC' | 'MANUAL' | 'PROMO' | 'IMPORTED';
  sourceProductKey?: string;

  warehouse?: string | null;  // snapshot simple
  binLocation?: string | null;

  // Si viene desde tu Quote original (para trazar)
  quoteItemId?: string | null;
};

export type CustomerSnapshotDto = {
  name: string;
  lastname?: string;
  phone?: string;
  email?: string;
  location?: string;
  // Extras MX
  rfc?: string;
  razonSocial?: string;
  usoCFDI?: string;
  regimenFiscal?: string;
  shippingAddress?: {
    street?: string;
    number?: string;
    postalCode?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    references?: string;
  };
  [k: string]: unknown;
};

export type SaveDraftDtoOption = {
  quoteId: string;
  sellerId?: string;
  customerId?: string | null;
  currency: string;
  taxRate: string;                 // "0.1600"
  currencyRate?: string | null;
  validUntil?: Date | null;
  paymentTerms?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
  summary?: string | null;
  customerSnapshot: CustomerSnapshotDto;
  items: SaveDraftItemDto[];
  idempotencyKey?: string | null;
};


/** Subconjunto del estado de tu store (Zustand) que necesitamos */
export interface StoreQuoteCustomer {
  id?: string;
  name: string;
  lastname?: string;
  phone?: string;
  email?: string;
  location?: string;
}

export interface StoreQuoteLine {
  id: string;
  description: string;
  ean?: string;
  um?: string;
  qty: number;

  // pricing
  cost: number | null;
  currency: string;        // 'MXN', 'USD', etc.
  price: number | null;
  margin: number | null;   // %
  // trazabilidad (opcional)
  source?: {
    productKey?: string;
    warehouse?: string;
  };
}

export interface StoreQuote {
  id: string;                    // corresponde a quoteId (BD)
  currency: string;              // ej. 'MXN'
  taxRate: number;               // ej. 0.16 (16%)
  customer?: StoreQuoteCustomer; // del UI
  items: StoreQuoteLine[];
  summary?: string;
  chatThreadId?: string;
  fileKey?: string;
  branch?: string;
}

/** Parámetros para ejecutar el caso de uso */
export interface SaveQuoteDraftParams {
  quoteId: string;               // el Quote.id original (BD)
  sellerId?: string;
  customerId?: string | null;    // si quieres ligar al Customer vivo
  storeQuote: StoreQuote;        // estado来自你的Zustand
  validUntil?: Date | null;
  paymentTerms?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
  idempotencyKey?: string | null;
}


export class SaveDraftDto {

  quoteId: string;
  sellerId?: string;
  customerId?: string | null;
  currency: string;
  taxRate: string;                 // "0.1600"
  currencyRate?: string | null;
  validUntil?: Date | null;
  paymentTerms?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
  summary?: string | null;
  customerSnapshot: CustomerSnapshotDto;
  items: SaveDraftItemDto[];
  idempotencyKey?: string | null;

  constructor(option: SaveDraftDtoOption) {
    this.quoteId = option.quoteId
    this.sellerId = option.sellerId
    this.customerId = option.customerId
    this.currency = option.currency
    this.taxRate = option.taxRate
    this.currencyRate = option.currencyRate
    this.validUntil = option.validUntil
    this.paymentTerms = option.paymentTerms
    this.deliveryTime = option.deliveryTime
    this.notes = option.notes
    this.summary = option.summary
    this.customerSnapshot = option.customerSnapshot
    this.items = option.items
    this.idempotencyKey = option.idempotencyKey

  }


  static execute = (values: Record<any, any>): [string?, SaveDraftDto?] => {

    const {
      quoteId,
      sellerId,
      customerId = null,
      storeQuote,
      validUntil = null,
      paymentTerms = null,
      deliveryTime = null,
      notes = null,
      idempotencyKey = null,
    } = values;


    if (!quoteId) return ['quoteId es requerido']
    if (!storeQuote?.id === quoteId) return ['storeQuote.id debe coincidir con quoteId']
    if (storeQuote?.items?.length === 0) return ['La cotización debe contener al menos un renglón']
    if (!storeQuote.currency) return ['currency es requerido']
    const taxRateStr = this.numToStr(storeQuote.taxRate, 4);

    if (taxRateStr === null) return ['taxRate inválido']

    const customerSnapshot = {
      name: storeQuote.customer?.name ?? '',
      lastname: storeQuote.customer?.lastname ?? '',
      phone: storeQuote.customer?.phone ?? '',
      email: storeQuote.customer?.email ?? '',
      location: storeQuote.customer?.location ?? '',
    };

    const items = storeQuote.items.map((l) => {
      return {
        id: l.id,
        uiLineId: l.id,
        description: l.description,
        ean: l.ean ?? undefined,
        codigo: undefined, // si tienes código en tu UI, pásalo aquí
        um: l.um ?? 'UNIT',
        quantity: this.numToStr(l.qty, 4)!,                 // "10.0000"
        cost: this.numToStr(l.cost, 2),                     // "950.00" | null
        currency: l.currency,
        price: this.numToStr(l.price, 2),                   // "1250.00" | null
        marginPct: this.numToStr(l.margin, 2),              // "31.58" | null
        discountPct: null,
        discountAmount: null,
        taxRate: taxRateStr,                           // por línea == cabecera (si usas IVA por línea cámbialo)
        priceOrigin: l.margin != null ? 'MANUAL' : 'AUTOMATIC',
        sourceProductKey: l.source?.productKey ?? undefined,
        warehouse: l.source?.warehouse ?? null,        // snapshot
        binLocation: null,
        quoteItemId: l.id,                              // llena si traes el id del item original
      };
    });

    return [undefined, new SaveDraftDto({
      quoteId,
      sellerId,
      customerId,
      currency: storeQuote.currency,
      taxRate: taxRateStr!,
      currencyRate: null,
      validUntil,
      paymentTerms,
      deliveryTime,
      notes,
      summary: storeQuote.summary ?? null,
      customerSnapshot,
      items,
      idempotencyKey,
    })]

  }

  static numToStr = (n: number | null | undefined, decimals = 2): string | null => {
    if (n == null || !Number.isFinite(n)) return null;
    return n.toFixed(decimals);
  };

}