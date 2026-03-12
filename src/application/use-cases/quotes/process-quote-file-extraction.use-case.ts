import { QuoteRepository, ReplaceQuoteItemInput } from "../../../domain/repositories/quote.repository";
import { QuoteExtractionService } from "../../../domain/services/quote-extraction.service";
import { FileStorageService } from "../../../domain/services/file-storage.service";

interface ExecuteOptions {
  quoteId: string
  fileKey: string
}

export class ProcessQuoteFileExtractionUseCase {
  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly quoteExtractionService: QuoteExtractionService
  ) { }

  async execute(options: ExecuteOptions) {
    const fileUrl = await this.fileStorageService.generatePresignedUrl(options.fileKey, 900)
    const fileResponse = await fetch(fileUrl)

    if (!fileResponse.ok) {
      throw new Error('No se pudo leer el archivo adjunto de la cotización')
    }

    const fileBytes = new Uint8Array(await fileResponse.arrayBuffer())
    const contentType = fileResponse.headers.get('content-type') ?? undefined
    const fileName = options.fileKey.split('/').pop() || options.fileKey

    const extraction = await this.quoteExtractionService.extractFromFile({
      filename: fileName,
      mimeType: contentType,
      bytes: fileBytes
    })

    const items: ReplaceQuoteItemInput[] = (extraction.items ?? [])
      .map((item) => {
        const description = `${item.description_original ?? item.description_normalizada ?? ''}`.trim()
        if (!description) return null

        const quantityValue = Number(item.cantidad ?? 0)
        const quantity = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 1
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

    const quote = await this.quoteRepository.replaceQuoteItems(options.quoteId, items)

    return {
      quote,
      extraction: {
        jobId: extraction.jobId,
        status: extraction.status,
        fileName: extraction.fileName,
        fileType: extraction.fileType,
        itemsCount: items.length
      }
    }
  }
}
