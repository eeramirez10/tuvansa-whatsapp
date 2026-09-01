import { LanguageModelService } from "../../../domain/services/language-model.service";
import { ChatThreadRepository } from '../../../domain/repositories/chat-thread.repository';
import { ChatThreadEntity } from "../../../domain/entities/chat-thread.entity";
const IMPORTED_HISTORY_LIMIT = 20

interface EnsureChatThreadResult {
  chatThread: ChatThreadEntity;
  conversationId: string;
}


export class EnsureChatThreadForPhoneUseCase {

  constructor(
    private readonly openaiService: LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository
  ) { }


  async execute(phoneWa: string): Promise<EnsureChatThreadResult> {

    let chatThread = await this.chatThreadRepository.findByPhone(phoneWa)



    if (!chatThread) {
      const conversationId = await this.openaiService.createConversation()

      chatThread = await this.chatThreadRepository.createThread({
        clientPhoneNumber: phoneWa,
        threadId: conversationId
      })
    } else if (!chatThread.openAiThreadId.startsWith('conv_')) {
      const history = await this.chatThreadRepository.getRecentMessages(
        chatThread.id,
        IMPORTED_HISTORY_LIMIT
      )
      const conversationId = await this.openaiService.createConversation(
        history
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .map((message) => ({
            role: message.role as 'user' | 'assistant',
            content: message.content
          }))
      )

      chatThread = await this.chatThreadRepository.updateExternalConversationId(
        chatThread.id,
        conversationId
      )
    }

    await this.chatThreadRepository.setProcessing(chatThread.id, false)

    return {
      chatThread,
      conversationId: chatThread.openAiThreadId
    }

  }

}
