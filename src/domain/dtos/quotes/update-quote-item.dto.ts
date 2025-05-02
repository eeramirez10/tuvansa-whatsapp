
interface UpdateQuoteItem {
  description?: string;
  ean?: string;
  codigo?: string;
  price?: number | null
  cost?: number | null
  quantity?: number
  um?: string

}
export class UpdateQuoteItemDto {

  public readonly description?: string;
  public readonly ean?: string;
  public readonly codigo?: string;
  public readonly price?: number | null
  public readonly cost?: number | null
  public readonly quantity?: number
  public readonly um?: string

  constructor(options: UpdateQuoteItem) {

    this.description = options.description
    this.ean = options.ean
    this.codigo = options.codigo
    this.price = options.price
    this.cost = options.cost
    this.quantity = options.quantity
    this.um = options.um

  }

  static execute(quoteItem: UpdateQuoteItem): [string?, UpdateQuoteItemDto?] {

    const {

      description,
      ean,
      codigo,
      price,
      cost,
      quantity,
      um,

    } = quoteItem


    if (description !== undefined && description.trim() === "") {
      return ["La descripción, de estar presente, no puede estar vacía"];
    }
    // Validar quantity: si se envía, debe ser un número positivo
    if (quantity !== undefined) {
      if (typeof quantity !== "number" || quantity <= 0) {
        return ["La cantidad, de estar presente, debe ser un número positivo"];
      }
    }
    // Validar price: si se envía, debe ser un número mayor o igual a 0
    if (price !== undefined) {
      if (typeof price !== "number" || price < 0) {
        return ["El precio, de estar presente, debe ser mayor o igual a 0"];
      }
    }
    // Validar cost: si se envía, debe ser un número mayor o igual a 0
    if (cost !== undefined) {
      if (typeof cost !== "number" || cost < 0) {
        return ["El costo, de estar presente, debe ser mayor o igual a 0"];
      }
    }

    if (
      description === undefined &&
      ean === undefined &&
      codigo === undefined &&
      quantity === undefined &&
      um === undefined &&
      price === undefined &&
      cost === undefined
    ) {
      return ["No se ha enviado ningún campo para actualizar"];
    }


    return [undefined, new UpdateQuoteItemDto(quoteItem)]

  }


}