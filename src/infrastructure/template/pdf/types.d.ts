
export type QuotePrintStatus = 'DRAFT' | 'FINAL';

export interface QuotePrintHeader {
  folio: string | number;
  versionNumber: number;
  status: QuotePrintStatus;
  createdAt: string;
  validUntil?: string | null;
}

export interface QuotePrintCompany {
  name: string;
  rfc?: string;
  logoUrl?: string;
  addressLines?: string[];
  phone?: string;
  website?: string;
}

export interface QuotePrintCustomer {
  name: string;
  lastname?: string;
  phone?: string;
  email?: string;
  location?: string;
  rfc?: string;
}

export interface QuotePrintTotals {
  currency: string;
  subtotal: string;
  taxRate: string;
  taxTotal: string;
  grandTotal: string;
}

export interface QuotePrintItem {
  index: number;
  description: string;
  ean?: string | null;
  codigo?: string | null;
  um?: string;
  quantity: string;
  unitPrice?: string | null;
  lineTotal: string;
}

export interface QuotePrintTerms {
  paymentTerms?: string | null;
  deliveryTime?: string | null;
  notes?: string | null;
  agentName?: string | null;
  formCode?: string | null;
}

export interface QuotePrintBranding {
  showWatermarkDraft: boolean;
  showBorders?: boolean;
}

export interface QuotePrintProps {
  header: QuotePrintHeader;
  company: QuotePrintCompany;
  customer: QuotePrintCustomer;
  items: QuotePrintItem[];
  totals: QuotePrintTotals;
  terms: QuotePrintTerms;
  branding: QuotePrintBranding;
}
