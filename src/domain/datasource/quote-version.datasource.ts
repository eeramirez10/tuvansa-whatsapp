import { VersionStatus } from "@prisma/client";
import { SaveDraftDto } from "../dtos/versions/save-draft.dto";
import { QuoteVersionItemEntity } from "../entities/quote-version-item.entity";
import { QuoteVersionEntity } from "../entities/quote-version.entity";
import { QuoteEntity } from "../entities/quote.entity";

export type FinalizeAndVersionInput = {
  quoteId: string;
  sellerId?: string;
  // snapshot desde Zustand
  currency: string;
  taxRate: string;              // usarás Decimal como string
  customerSnapshot: unknown;    // DTO validado (name, phone, email, location, etc.)
  summary?: string;
  validUntil?: Date | null;
  paymentTerms?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;

  // líneas (lo que tienes en Zustand)
  items: Array<{
    uiLineId?: string;
    description: string;
    ean?: string;
    codigo?: string;
    um?: string;
    quantity: string;          // Decimal string "12.0000"
    cost?: string | null;      // Decimal string
    currency: string;
    price?: string | null;     // Decimal string
    marginPct?: string | null; // Decimal string
    discountPct?: string | null;
    discountAmount?: string | null;
    taxRate?: string | null;
    priceOrigin?: 'AUTOMATIC' | 'MANUAL' | 'PROMO' | 'IMPORTED';
    sourceProductKey?: string;
    warehouse?: string | null;   // snapshot
    binLocation?: string | null; // snapshot
    quoteItemId?: string | null; // si viene de la base
  }>;

  // idempotencia
  idempotencyKey?: string;
};

export interface createArtifactDto {
  quoteVersionId: string;
  type: 'PDF' | 'HTML';
  fileKey: string;             // S3 key
  mimeType?: string | null;
  checksum?: string | null;
  publicUrl?: string | null;

}


// export interface createArtifactDto {
//   quoteVersionId: string;
//   type: 'PDF';
//   storageKey: string;
//   sizeBytes: number;
//   contentType: string;
//   checksumSha256: string;
//   status: 'FINAL' | 'DRAFT';

// }

export type QuoteVersionWithItems = {
  version: QuoteVersionEntity; // QuoteVersionEntity
  items: QuoteVersionItemEntity[]; // QuoteVersionItemEntity[]
  quote?: QuoteEntity
};

export abstract class QuoteVersionDatasource {


  abstract createVersion(input: FinalizeAndVersionInput): Promise<QuoteVersionWithItems>;
  abstract saveDraft(input: SaveDraftDto): Promise<QuoteVersionWithItems>;

  /** Busca el DRAFT actual de un quote. */
  abstract getDraftByQuote(quoteId: string): Promise<QuoteVersionWithItems | null>;

  /** Busca el DRAFT actual de un quote. */
  abstract getDraftByQuote(quoteId: string): Promise<QuoteVersionWithItems | null>;
  abstract listByQuote(quoteId: string): Promise<{ id: string; versionNumber: number; createdAt: Date; grandTotal: string }[]>;
  abstract getVersion(versionId: string): Promise<QuoteVersionWithItems | null>;
  abstract getByQuoteAndNumber(quoteId: string, versionNumber: number): Promise<QuoteVersionWithItems | null>;

  abstract updateStatus(id: string, status: VersionStatus): Promise<QuoteVersionWithItems | null>



}