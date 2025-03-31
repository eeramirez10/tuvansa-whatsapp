import { AddQuoteItemsDto } from "../../domain/dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../../domain/dtos/create-quote.dto";
import { QuoteRepository } from "../../domain/repositories/quote.repository";
import { QuoteDatasource } from '../../domain/datasource/quote.datasource';
import { QuoteEntity } from "../../domain/entities/quote.entity";
import { QuoteItemEntity } from "../../domain/entities/quote-item.entity";


export class QuoteRepositoryImpl extends QuoteRepository {



  constructor(private readonly quoteDatasource: QuoteDatasource) {
    super();
  }


  getQuote(id: string): Promise<QuoteEntity | null> {
    return this.quoteDatasource.getQuote(id)
  }

  getQuotes(): Promise<QuoteEntity[]> {
    return this.quoteDatasource.getQuotes()
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



}