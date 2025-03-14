import { AddQuoteItemsDto } from "../../domain/dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../../domain/dtos/create-quote.dto";
import { QuoteRepository } from "../../domain/repositories/quote.repository";
import { QuoteDatasource } from '../../domain/datasource/quote.datasource';
import { QuoteEntity } from "../../domain/entities/quote.entity";
import { QuoteItemEntity } from "../../domain/entities/quote-item.entity";


export class QuoteRepositoryImpl extends QuoteRepository {

  
  findByQuoteNumber({ quoteNumber }: { quoteNumber: number; }): Promise<QuoteEntity | null> {
    return this.quoteDatasource.findByQuoteNumber({quoteNumber})
  }

  constructor(private readonly quoteDatasource: QuoteDatasource){
    super();
  }

  createQuote(createQuoteDto: CreateQuoteDto): Promise<QuoteEntity> {
    return this.quoteDatasource.createQuote(createQuoteDto)
  }
  addQuoteItems(addQuoteItems: AddQuoteItemsDto): Promise<QuoteItemEntity> {
    return this.quoteDatasource.addQuoteItems(addQuoteItems)
  }



}