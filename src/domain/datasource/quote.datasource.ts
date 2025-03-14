import { AddQuoteItemsDto } from "../dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../dtos/create-quote.dto";
import { QuoteItemEntity } from "../entities/quote-item.entity";
import { QuoteEntity } from "../entities/quote.entity";





export abstract class QuoteDatasource {

  abstract createQuote(createQuoteDto: CreateQuoteDto): Promise<QuoteEntity>

  abstract addQuoteItems(addQuoteItems: AddQuoteItemsDto): Promise<QuoteItemEntity>

  abstract getNextQuoteNumber(): Promise<number>; 

  abstract findByQuoteNumber({quoteNumber}:{ quoteNumber: number}):Promise<QuoteEntity | null> 

  


}