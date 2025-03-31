import { ChatThreadRepository } from '../../../domain/repositories/chat-thread.repository';


export class GetThreadsUseCase {

  constructor(private readonly chatThreadRepository:ChatThreadRepository){}


  async execute(){


    return this.chatThreadRepository.getThreads()

  }
}