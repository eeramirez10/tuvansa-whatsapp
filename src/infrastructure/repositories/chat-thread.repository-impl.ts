import { AddMessageDto } from "../../domain/dtos/add-message.dto";
import { CreateThreadDto } from "../../domain/dtos/create-thread.dto";
import { ChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import { ChatThreadDatasource } from '../../domain/datasource/chat-thread.datasource';
import { ChatThreadEntity } from "../../domain/entities/chat-thread.entity";
import { MessageEntity } from "../../domain/entities/message.entity";




export class ChatThreadRepositoryImpl extends ChatThreadRepository {


  getMessagesByThread(threadId: string): Promise<ChatThreadEntity | null> {
    return this.chatThreadDatasource.getMessagesByThread(threadId)
  }



  constructor(private readonly chatThreadDatasource: ChatThreadDatasource) {
    super();
  }
  getThreads(): Promise<ChatThreadEntity[]> {
    return this.chatThreadDatasource.getThreads()
  }






  addCustomer(openAiThreadId: string, customerId: string): Promise<ChatThreadEntity> {
    return this.chatThreadDatasource.addCustomer(openAiThreadId, customerId)
  }


  getByThreadId(threadId: string): Promise<ChatThreadEntity | null> {
    return this.chatThreadDatasource.getByThreadId(threadId)
  }

  getThreadByPhone({ phone }: { phone: string; }): Promise<ChatThreadEntity | null> {
    return this.chatThreadDatasource.getThreadByPhone({ phone })
  }

  createThread(createThreadDto: CreateThreadDto): Promise<ChatThreadEntity> {
    return this.chatThreadDatasource.createThread(createThreadDto)
  }
  addMessage(addMessageDto: AddMessageDto): Promise<MessageEntity> {
    return this.chatThreadDatasource.addMessage(addMessageDto)
  }


}