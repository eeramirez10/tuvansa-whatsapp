import { GetQuotesDto } from "../../../domain/dtos/quotes/get-quotes.dto";
import { QuoteRepository } from "../../../domain/repositories/quote.repository";
import { OpenAIService } from '../../../infrastructure/services/openai.service';
import { OpenAiFunctinsService } from '../../../infrastructure/services/openai-functions.service';
import { UpdateQuoteItemDto } from "../../../domain/dtos/quotes/update-quote-item.dto";
import { UpdateQuoteDto } from "../../../domain/dtos/quotes/update-quote.dto";


export class GetQuotesUseCase {

  constructor(private readonly quoteRepository: QuoteRepository, private readonly openAIService: OpenAiFunctinsService) { }

  async execute(getQuotesDto: GetQuotesDto) {

    const quotes = (await this.quoteRepository.getQuotes(getQuotesDto))

    // console.log(quotes)

    let newQuotes = await Promise.all(
      quotes.items.map(async (quote) => {

      
        if (quote.chatThread && !quote.summary && quote.chatThread.messages.length > 0) {

       
          const messages = quote
            .chatThread
            .messages
            .map((mesagge) => ({
              role: mesagge.role,
              content: mesagge.content,
              createdAt: mesagge.createdAt.toISOString()
            }))

          const summary = await this.openAIService.summarizeConversation(messages)

          const [, updateQUoteDto] = UpdateQuoteDto.execute({ summary })

          await this.quoteRepository.updateQuote(quote.id, updateQUoteDto)

          return {
            ...quote,
            summary
          }
        }

        return quote
      })
    )




    return { items: newQuotes, ...quotes }

  }
}