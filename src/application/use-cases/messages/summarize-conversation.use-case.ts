import { QuoteEntity } from '../../../domain/entities/quote.entity';
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

    let summary: string;

    let updatedQuote: QuoteEntity;

    console.log("SummarizeConversationUseCase")

    // if (quote.fileKey) {

    //   summary = "El cliente adjunto un archivo, procesar el archivo en del detalle para poder verlo"

    //   updatedQuote = await this.quoteRepository.updateQuote(quoteId, { summary })

    //   return {
    //     summary: updatedQuote.summary
    //   }
    // }

    const hoursAgo = 0.10;

    const cuttoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);


    const messages = quote.chatThread.messages.map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: message.createdAt.toISOString()
    })).filter((msg) => new Date(msg.createdAt) >= cuttoffDate)

    console.log({messages})

    summary = await this.openAiFunctions.summarizeConversation(messages)

    updatedQuote = await this.quoteRepository.updateQuote(quoteId, { summary })


    return {
      summary: updatedQuote.summary
    }


  }
}

