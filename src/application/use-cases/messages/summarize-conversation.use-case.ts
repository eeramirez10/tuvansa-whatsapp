import { QuoteRepository } from '../../../domain/repositories/quote.repository';
import { OpenAiFunctinsService } from '../../../infrastructure/services/openai-functions.service';



export class SummarizeConversationUseCase {

  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly openAiFunctions: OpenAiFunctinsService
  ) {

  }


  async execute(quoteId: string) {

    const quote = await this.quoteRepository.getQuote(quoteId)

    const messages = quote.chatThread.messages.map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    }))


    const summary = await this.openAiFunctions.summarizeConversation(messages)

    const updatetQuote = await this.quoteRepository.updateQuote(quoteId, { summary })


    return {
      summary: updatetQuote.summary
    }


  }
}

