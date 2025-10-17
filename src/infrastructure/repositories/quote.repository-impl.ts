import { AddQuoteItemsDto } from "../../domain/dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../../domain/dtos/create-quote.dto";
import { QuoteRepository } from "../../domain/repositories/quote.repository";
import { QuoteDatasource } from '../../domain/datasource/quote.datasource';
import { QuoteEntity } from "../../domain/entities/quote.entity";
import { QuoteItemEntity } from "../../domain/entities/quote-item.entity";
import { UpdateQuoteItemDto } from "../../domain/dtos/quotes/update-quote-item.dto";
import { GetQuotesDto } from "../../domain/dtos/quotes/get-quotes.dto";
import { UpdateQuoteDto } from "../../domain/dtos/quotes/update-quote.dto";
import { PaginationResult } from "../../domain/entities/pagination-result";


export class QuoteRepositoryImpl extends QuoteRepository {





  constructor(private readonly quoteDatasource: QuoteDatasource) {
    super();
  }


  updateQuoteItem(id: string, updateQuoteItemDto: UpdateQuoteItemDto): Promise<QuoteItemEntity> {
    return this.quoteDatasource.updateQuoteItem(id, updateQuoteItemDto)
  }



  getQuote(id: string): Promise<QuoteEntity | null> {
    return this.quoteDatasource.getQuote(id)
  }

  getQuotes(getQuotesDto: GetQuotesDto): Promise<PaginationResult<QuoteEntity>> {
    return this.quoteDatasource.getQuotes(getQuotesDto)
  }


  findByQuoteNumber({ quoteNumber }: { quoteNumber: number; }): Promise<QuoteEntity | null> {
    return this.quoteDatasource.findByQuoteNumber({ quoteNumber })
  }

  createQuote(createQuoteDto: CreateQuoteDto): Promise<QuoteEntity> {
    return this.quoteDatasource.createQuote(createQuoteDto)
  }
  addQuoteItems(addQuoteItems: AddQuoteItemsDto): Promise<QuoteItemEntity> {
    return this.quoteDatasource.addQuoteItems(addQuoteItems)
  }

  updateQuote(id: string, updateQuoteDto: UpdateQuoteDto): Promise<QuoteEntity> {
    return this.quoteDatasource.updateQuote(id, updateQuoteDto)
  }


}