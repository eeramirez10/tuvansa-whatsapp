import { CustomerEntity } from "./customer-entity";
import { QuoteItemEntity } from "./quote-item.entity";


interface QuoteOptions {
  id: string;
  createdAt: Date;
  quoteNumber: number;
  customerId: string;   
  items: QuoteItemEntity[];
  customer?: CustomerEntity;       
  fileKey?: string
}

export class QuoteEntity  {
  readonly id: string;
  readonly createdAt: Date;
  readonly quoteNumber: number;
  readonly customerId: string;
  readonly items: QuoteItemEntity[];
  readonly customer?: CustomerEntity;
  readonly fileKey?: string

  constructor(options: QuoteOptions) {
    this.id = options.id;
    this.createdAt = options.createdAt;
    this.quoteNumber = options.quoteNumber;
    this.customerId = options.customerId;
    this.items = options.items;
    this.customer = options.customer;
  }
}
