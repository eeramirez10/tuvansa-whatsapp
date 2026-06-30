interface Options {
  sellerId: string | null
}

export class AssignQuoteSellerDto {
  public readonly sellerId: string | null

  private constructor(options: Options) {
    this.sellerId = options.sellerId
  }

  static execute(options: Record<string, unknown>): [string?, AssignQuoteSellerDto?] {
    if (options.sellerId === null) {
      return [
        undefined,
        new AssignQuoteSellerDto({
          sellerId: null
        })
      ]
    }

    const sellerId = `${options.sellerId ?? ''}`.trim()

    if (!sellerId) {
      return ['sellerId es requerido']
    }

    return [
      undefined,
      new AssignQuoteSellerDto({
        sellerId
      })
    ]
  }
}
