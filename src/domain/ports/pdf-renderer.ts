import { QuoteVersionItemEntity } from "../entities/quote-version-item.entity";
import { QuoteVersionEntity } from "../entities/quote-version.entity";
import { QuoteEntity } from "../entities/quote.entity";


export interface PdfRenderer {


  renderQuoteVersion(version: QuoteVersionEntity, item: QuoteVersionItemEntity[], quote:QuoteEntity, opts?: { watermarkDraft?: boolean }): Promise<Uint8Array<ArrayBufferLike>>

  
}