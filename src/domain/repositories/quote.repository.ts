import { AddQuoteItemsDto } from "../dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../dtos/create-quote.dto";
import { GetQuotesDto } from "../dtos/quotes/get-quotes.dto";
import { UpdateQuoteItemDto } from "../dtos/quotes/update-quote-item.dto";
import { UpdateQuoteDto } from "../dtos/quotes/update-quote.dto";
import { PaginationResult } from "../entities/pagination-result";
import { QuoteItemEntity } from "../entities/quote-item.entity";
import { QuoteEntity } from "../entities/quote.entity";


export abstract class QuoteRepository {

  abstract createQuote(createQuoteDto: CreateQuoteDto): Promise<QuoteEntity>

  abstract addQuoteItems(addQuoteItems: AddQuoteItemsDto): Promise<QuoteItemEntity>

  abstract findByQuoteNumber({ quoteNumber }: { quoteNumber: number }): Promise<QuoteEntity | null>

  abstract getQuotes(getQuotesDto: GetQuotesDto): Promise<PaginationResult<QuoteEntity>>


  abstract getQuote(id: string): Promise<QuoteEntity | null>

  abstract updateQuoteItem(id: string, updateQuoteItemDto: UpdateQuoteItemDto): Promise<QuoteItemEntity>

  abstract updateQuote(id: string, updateQuoteDto: UpdateQuoteDto): Promise<QuoteEntity>

}