import { UserEntity } from "../../entities/user.entity";

export type PreferMode = 'final' | 'draft';

export type IncludeKeys = Array<'items' | 'artifacts' | 'messages'>;

export interface DisplayQuery {
  quoteId: string;
  prefer: PreferMode;
  include: IncludeKeys;
  presignSeconds?: number;
}

export type ResolutionReason = 'FINAL_FOUND' | 'DRAFT_FALLBACK' | 'NO_VERSION';

export interface DisplayResult {
  source: 'VERSION' | 'QUOTE';
  resolution: {
    reason: ResolutionReason;
    usedVersionId: string | null;
  };
  quote: {
    id: string;
    quoteNumber: number | null;
    createdAt: string;
    fileKey: string,
    chatThreadId: string,
    summary: string,
    customer: {
      id: string;
      name: string;
      lastname: string | null;
      phone: string | null;
      email: string | null;
      location: string | null;
    };
    // 👇 Solo presente cuando source="QUOTE"
    items?: Array<{
      id: string;
      description: string;
      ean: string | null;
      codigo: string | null;
      um: string | null;
      quantity: string;
      price: string | null;
      lineTotal: string;   // qty * price (0 si price null)
    }>;
    totals?: {
      currency: string | null;  // si tienes currency en Quote, ponla; si no, null
      taxRate: string | null;
      subtotal: string;
      taxTotal: string;
      grandTotal: string;
    };
  };
  version: null | {
    id: string;
    versionNumber: number;
    status: 'DRAFT' | 'FINAL';
    currency: string;
    taxRate: string;     // string para no perder precisión
    subtotal: string;
    taxTotal: string;
    grandTotal: string;
    validUntil: string | null;
    createdAt:string,
    updatedAt:string | null
    seller: { id: string; name: string } | null;
    items?: Array<{
      id: string;
      description: string;
      ean: string | null;
      codigo: string | null;
      um: string | null;
      quantity: string;
      price: string | null;
      lineTotal: string;
    }>;
    artifacts?: Array<{
      id: string;
      type: 'PDF' | 'HTML' | string;
      fileKey: string;
      mimeType: string | null;
      checksum: string | null;
      createdAt: string;
      presignedUrl?: string;
      expiresIn?: number;
    }>;
    // messages? => lo agregas si activas include 'messages'
  };
  quoteMeta: {
    pdfSentAt: string | null
    quoteCreatedAt: string | null
    versionCreatedAt: string | null
    sentVia: string | null
    sentTo: string | null
    createdByUser: UserEntity | null
    assignedAt: string | null
    assignedByUserId: string | null
    viewedAt: string | null
    acceptedAt: string | null
    rejectedAt: string | null
    lastUpdatedAt: string | null
  }
  capabilities: {
    hasVersion: boolean;
    hasPdf: boolean;
    canGeneratePdf: boolean;
    canSendWhatsApp: boolean;
  };
}