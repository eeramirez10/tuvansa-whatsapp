import { AddQuoteItemsDto } from "../dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../dtos/create-quote.dto";
import { QuoteItemEntity } from "../entities/quote-item.entity";
import { QuoteEntity } from "../entities/quote.entity";
import { UpdateQuoteItemDto } from '../dtos/quotes/update-quote-item.dto';
import { GetQuotesDto } from "../dtos/quotes/get-quotes.dto";
import { Quote } from "@prisma/client";
import { UpdateQuoteDto } from '../dtos/quotes/update-quote.dto';
import { PaginationResult } from "../entities/pagination-result";





export abstract class QuoteDatasource {

  abstract getQuotes(etQuotesDto: GetQuotesDto): Promise<PaginationResult<QuoteEntity>>

  abstract createQuote(createQuoteDto: CreateQuoteDto): Promise<QuoteEntity>

  abstract addQuoteItems(addQuoteItems: AddQuoteItemsDto): Promise<QuoteItemEntity>

  abstract getNextQuoteNumber(): Promise<number>;

  abstract findByQuoteNumber({ quoteNumber }: { quoteNumber: number }): Promise<QuoteEntity | null>

  abstract getQuote(id: string): Promise<QuoteEntity | null>

  abstract updateQuoteItem(id: string, updateQuoteItemDto: UpdateQuoteItemDto): Promise<QuoteItemEntity>
  abstract updateQuote(id: string, updateQuoteDto: UpdateQuoteDto): Promise<QuoteEntity>

}