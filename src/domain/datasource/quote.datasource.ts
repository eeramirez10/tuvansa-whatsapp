import { AddQuoteItemsDto } from "../dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../dtos/create-quote.dto";
import { QuoteItemEntity } from "../entities/quote-item.entity";
import { QuoteEntity } from "../entities/quote.entity";
import { UpdateQuoteItemDto } from '../dtos/quotes/update-quote-item.dto';





export abstract class QuoteDatasource {

  abstract getQuotes(): Promise<QuoteEntity[]>

  abstract createQuote(createQuoteDto: CreateQuoteDto): Promise<QuoteEntity>

  abstract addQuoteItems(addQuoteItems: AddQuoteItemsDto): Promise<QuoteItemEntity>

  abstract getNextQuoteNumber(): Promise<number>;

  abstract findByQuoteNumber({ quoteNumber }: { quoteNumber: number }): Promise<QuoteEntity | null>

  abstract getQuote(id: string): Promise<QuoteEntity | null>

  abstract updateQuoteItem(id: string, updateQuoteItemDto: UpdateQuoteItemDto): Promise<QuoteItemEntity>

}