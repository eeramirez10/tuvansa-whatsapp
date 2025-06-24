"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateQuoteItemUseCase = void 0;
class UpdateQuoteItemUseCase {
    constructor(quoteRepository) {
        this.quoteRepository = quoteRepository;
    }
    execute(id, dto) {
        const dataToUpdate = {};
        if (dto.description !== undefined)
            dataToUpdate.description = dto.description;
        if (dto.ean !== undefined)
            dataToUpdate.ean = dto.ean;
        if (dto.codigo !== undefined)
            dataToUpdate.codigo = dto.codigo;
        if (dto.quantity !== undefined)
            dataToUpdate.quantity = dto.quantity;
        if (dto.um !== undefined)
            dataToUpdate.um = dto.um;
        if (dto.price !== undefined)
            dataToUpdate.price = dto.price;
        if (dto.cost !== undefined)
            dataToUpdate.cost = dto.cost;
        return this.quoteRepository.updateQuoteItem(id, dataToUpdate);
    }
}
exports.UpdateQuoteItemUseCase = UpdateQuoteItemUseCase;
