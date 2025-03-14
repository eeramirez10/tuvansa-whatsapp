import OpenAI from "openai";
import { ChatThreadRepository } from '../../domain/repositories/chat-thread.repository';

// export const createThreadUseCase = async (openai: OpenAI) => {
//   const { id } = await openai.beta.threads.create()
//   return id 
// }


interface Options {
  openAi: OpenAI
  chatThreadRepository: ChatThreadRepository
}

export class CreateThreadUseCase {
  readonly openAi: OpenAI
  readonly chatThreadRepository: ChatThreadRepository
  constructor(options: Options) {

    this.openAi = options.openAi
    this.chatThreadRepository = options.chatThreadRepository
  }



  async execute({ phone }: { phone: string }) {

    const findNumberInDB = await this.chatThreadRepository.getThreadByPhone({ phone })

    

    if (!findNumberInDB?.id) {

  
      const { id: threadId } = await this.openAi.beta.threads.create()

      await this.chatThreadRepository.createThread({
        threadId,
        clientPhoneNumber: phone
      })

      return threadId
    }

    


    return findNumberInDB.openAiThreadId

  }


}