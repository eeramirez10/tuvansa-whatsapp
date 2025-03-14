import { ChatThreadRepository } from '../../domain/repositories/chat-thread.repository';



interface Message {


  role: "user" | "assistant";
  content: string[];

}


interface ExecuteOptions {
  messages: Message[]
  threadId: string
}

export class SaveHistoryChatUseCase {


  constructor(private readonly chatThreadRepository: ChatThreadRepository) { }

  async execute(options: ExecuteOptions) {

    const { messages, threadId } = options

    const asistantResponse = messages.filter(q => q.role === 'assistant')[0]

    const userQuestion = messages.filter(q => q.role === 'user')[0]


    await this.chatThreadRepository
      .addMessage({
        role: userQuestion.role,
        content: userQuestion.content[0],
        chatThreadId: threadId
      })

    await this.chatThreadRepository
      .addMessage({
        role: asistantResponse.role,
        content: asistantResponse.content[0],
        chatThreadId: threadId
      })



  }
}