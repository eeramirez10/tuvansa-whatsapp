import { ChatThreadRepository } from '../../../domain/repositories/chat-thread.repository';
import { GetThreadsDto } from '../../../domain/dtos/threads/get-threads.dto';


export class GetThreadsUseCase {

  constructor(private readonly chatThreadRepository:ChatThreadRepository){}


  async execute(getThreadsDto:GetThreadsDto){


    return this.chatThreadRepository.getThreads(getThreadsDto)

  }
}