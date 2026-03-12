export interface QuoteExtractionSourceFile {
  filename: string
  mimeType?: string
  bytes: Uint8Array
}

export interface QuoteExtractionItem {
  cantidad?: number
  unidad_original?: string
  unidad_normalizada?: string
  description_original?: string
  description_normalizada?: string
}

export interface QuoteExtractionResult {
  jobId?: string
  status: string
  fileName?: string
  fileType?: string
  itemsCount?: number
  items: QuoteExtractionItem[]
}

export abstract class QuoteExtractionService {
  abstract extractFromFile(file: QuoteExtractionSourceFile): Promise<QuoteExtractionResult>
}
