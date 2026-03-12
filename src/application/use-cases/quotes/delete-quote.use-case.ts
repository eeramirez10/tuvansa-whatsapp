import { QuoteRepository } from "../../../domain/repositories/quote.repository";

export class DeleteQuoteUseCase {
  constructor(private readonly quoteRepository: QuoteRepository) { }

  async execute(quoteId: string): Promise<void> {
    await this.quoteRepository.deleteQuote(quoteId)
  }
}
