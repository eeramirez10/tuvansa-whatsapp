import { ChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";
import { LanguageModelService } from "../../../domain/services/language-model.service";
import { OpenAIService } from "../../../infrastructure/services/openai.service";


export class SaveThreadUseCase {

  constructor( 
    private openaiService:LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository
  ){

  }


  async execute({ phone }: { phone: string }){

    const findNumberInDB = await this.chatThreadRepository.getThreadByPhone({ phone })


    if(findNumberInDB?.id) return findNumberInDB.openAiThreadId

    const threadId = await this.openaiService.createThread()

      await this.chatThreadRepository.createThread({
        threadId,
        clientPhoneNumber: phone
      })

    return threadId
    


    

  }
}