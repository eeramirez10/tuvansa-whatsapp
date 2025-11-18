import { AddMessageDto } from "../../domain/dtos/add-message.dto";
import { CreateThreadDto } from "../../domain/dtos/create-thread.dto";
import { ChatThreadRepository } from "../../domain/repositories/chat-thread.repository";
import { ChatThreadDatasource } from '../../domain/datasource/chat-thread.datasource';
import { ChatThreadEntity } from "../../domain/entities/chat-thread.entity";
import { MessageEntity } from "../../domain/entities/message.entity";
import { GetThreadsDto } from "../../domain/dtos/threads/get-threads.dto";
import { GetMessagesDto } from "../../domain/dtos/threads/get-messages.dto";




export class ChatThreadRepositoryImpl extends ChatThreadRepository {





  constructor(private readonly chatThreadDatasource: ChatThreadDatasource) {
    super();
  }




  findByPhone(phoneWa: string): Promise<ChatThreadEntity | null> {
    return this.chatThreadDatasource.findByPhone(phoneWa)
  }


  getMessagesByThread(threadId: string, getMessageDto: GetMessagesDto): Promise<ChatThreadEntity | null> {
    return this.chatThreadDatasource.getMessagesByThread(threadId, getMessageDto)
  }


  getThreads(getThreadsDto: GetThreadsDto): Promise<ChatThreadEntity[]> {
    return this.chatThreadDatasource.getThreads(getThreadsDto)
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

  getOrCreateByPhone(phoneWa: string): Promise<ChatThreadEntity> {
    return this.chatThreadDatasource.getOrCreateByPhone(phoneWa)
  }
  setProcessing(chatThreadId: string, isProcessing: boolean): Promise<void> {
    return this.chatThreadDatasource.setProcessing(chatThreadId, isProcessing)
  }



}