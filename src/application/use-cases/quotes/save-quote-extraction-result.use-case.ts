import { QuoteRepository, ReplaceQuoteItemInput } from "../../../domain/repositories/quote.repository";

interface ExtractionItemInput {
  cantidad?: number
  unidad_original?: string
  unidad_normalizada?: string
  description_original?: string
  description_normalizada?: string
}

interface ExecuteOptions {
  quoteId: string
  items: ExtractionItemInput[]
}

export class SaveQuoteExtractionResultUseCase {
  constructor(private readonly quoteRepository: QuoteRepository) { }

  async execute(options: ExecuteOptions) {
    const items = this.mapItems(options.items)
    return this.quoteRepository.replaceQuoteItems(options.quoteId, items)
  }

  private mapItems(items: ExtractionItemInput[]): ReplaceQuoteItemInput[] {
    return (items ?? [])
      .map((item) => {
        const description = `${item.description_original ?? item.description_normalizada ?? ''}`.trim()
        if (!description) return null

        const quantityRaw = Number(item.cantidad ?? 0)
        const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1
        const um = `${item.unidad_normalizada ?? item.unidad_original ?? ''}`.trim() || 'pza'

        return {
          description,
          quantity,
          um,
          ean: null,
          codigo: null,
          price: 0,
          cost: 0
        } as ReplaceQuoteItemInput
      })
      .filter((item): item is ReplaceQuoteItemInput => Boolean(item))
  }
}
