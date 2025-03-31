import { ChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";


export class GetMessagesByThreadUseCase {



  constructor(private readonly chatThreadRepository: ChatThreadRepository) { }



  execute(threadId: string) {
    return this.chatThreadRepository.getMessagesByThread(threadId)
  }
}