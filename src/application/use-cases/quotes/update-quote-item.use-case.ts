import { UpdateQuoteItemDto } from '../../../domain/dtos/quotes/update-quote-item.dto';
import { QuoteRepository } from '../../../domain/repositories/quote.repository';




export class UpdateQuoteItemUseCase {

  constructor(private readonly quoteRepository: QuoteRepository) { }



  execute(id: string, dto: UpdateQuoteItemDto) {

    const dataToUpdate: Partial<{
      description: string;
      ean: string;
      codigo: string;
      quantity: number;
      um: string;
      price: number;
      cost: number;
    }> = {}

    if (dto.description !== undefined) dataToUpdate.description = dto.description;
    if (dto.ean !== undefined) dataToUpdate.ean = dto.ean;
    if (dto.codigo !== undefined) dataToUpdate.codigo = dto.codigo;
    if (dto.quantity !== undefined) dataToUpdate.quantity = dto.quantity;
    if (dto.um !== undefined) dataToUpdate.um = dto.um;
    if (dto.price !== undefined) dataToUpdate.price = dto.price;
    if (dto.cost !== undefined) dataToUpdate.cost = dto.cost;


    return this.quoteRepository.updateQuoteItem(id, dataToUpdate)
  }
}