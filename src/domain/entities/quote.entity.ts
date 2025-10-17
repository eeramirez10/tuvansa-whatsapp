import { CustomerEntity } from "./customer-entity";
import { QuoteItemEntity } from "./quote-item.entity";
import { MessageEntity } from "./message.entity";
import { ChatThreadEntity } from "./chat-thread.entity";


interface QuoteOptions {
  id: string;
  createdAt: Date;
  quoteNumber: number;
  customerId: string;
  items?: QuoteItemEntity[];
  customer?: CustomerEntity;
  fileKey?: string
  summary?: string
  readonly chatThread?: ChatThreadEntity
}



export class QuoteEntity {
  readonly id: string;
  readonly createdAt: Date;
  readonly quoteNumber: number;
  readonly customerId: string;
  readonly items?: QuoteItemEntity[];
  readonly customer?: CustomerEntity;
  readonly fileKey?: string
  readonly chatThread?: ChatThreadEntity
  summary?: string

  constructor(options: QuoteOptions) {
    this.id = options.id;
    this.createdAt = options.createdAt;
    this.quoteNumber = options.quoteNumber;
    this.customerId = options.customerId;
    this.items = options.items;
    this.customer = options.customer;
    this.chatThread = options.chatThread
    this.summary = options.summary
  }
}
