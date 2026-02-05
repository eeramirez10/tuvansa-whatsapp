import { LanguageModelService } from "../../../domain/services/language-model.service";
import { ChatThreadRepository } from '../../../domain/repositories/chat-thread.repository';
import { ChatThreadEntity } from "../../../domain/entities/chat-thread.entity";
import { ChatThread } from '@prisma/client';

interface EnsureChatThreadResult {
  chatThread: ChatThreadEntity;
  threadId: string; // openAiThreadId
}


export class EnsureChatThreadForPhoneUseCase {

  constructor(
    private readonly openaiService: LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository
  ) { }


  async execute(phoneWa: string): Promise<EnsureChatThreadResult> {

    let chatThread = await this.chatThreadRepository.findByPhone(phoneWa)



    if (!chatThread) {
      const threadId = await this.openaiService.createThread()

      chatThread = await this.chatThreadRepository.createThread({ clientPhoneNumber: phoneWa, threadId })
    }


    await this.chatThreadRepository.setProcessing(chatThread.id, false)


    return {
      chatThread,
      threadId: chatThread.openAiThreadId
    }

  }

}