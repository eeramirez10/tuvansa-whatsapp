import { QuoteItem } from "@prisma/client";

interface QuoteItemOptions {
  id: string;
  description: string;
  ean: string;
  codigo: string;
  price: number | null
  cost: number | null
  quoteId: string
  quantity: number
  um: string
}

export class QuoteItemEntity implements QuoteItem {
  readonly id: string;
  readonly description: string;
  readonly ean: string;
  readonly codigo: string;
  readonly price: number | null;
  readonly cost: number | null;
  readonly quoteId: string;
  readonly quantity: number;
  readonly um: string;
  constructor(options: QuoteItemOptions) {
    this.id = options.id;
    this.description = options.description;
    this.ean = options.ean;
    this.codigo = options.codigo;
    this.price = options.price;
    this.cost = options.cost;
    this.quoteId = options.quoteId
    this.quantity = options.quantity
    this.um = options.um
  }


}
