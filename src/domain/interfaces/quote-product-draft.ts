export interface QuoteProductSpecification {
  name: string
  value: string
}

export interface QuoteProductDraft {
  family: string
  description: string
  quantity: number
  um?: string
  specifications?: QuoteProductSpecification[]
}

export interface QuoteProductValidationIssue {
  index: number
  family: string
  description: string
  missingFields: string[]
  unsupported: boolean
}

export interface ValidatedQuoteProduct {
  description: string
  quantity: number
  um: string
  ean: string
  codigo: string
}

export interface QuoteProductValidationResult {
  valid: boolean
  issues: QuoteProductValidationIssue[]
  items: ValidatedQuoteProduct[]
}
