import { ChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";
import { GetMessagesDto } from '../../../domain/dtos/threads/get-messages.dto';


export class GetMessagesByThreadUseCase {



  constructor(private readonly chatThreadRepository: ChatThreadRepository) { }



  execute(threadId: string, getMessageDto: GetMessagesDto) {
    return this.chatThreadRepository.getMessagesByThread(threadId,getMessageDto)
  }
}