
import { AddMessageDto } from "../dtos/add-message.dto";
import { CreateThreadDto } from "../dtos/create-thread.dto"
import { ChatThreadEntity } from "../entities/chat-thread.entity";
import { MessageEntity } from "../entities/message.entity";
import { GetThreadsDto } from '../dtos/threads/get-threads.dto';
import { GetMessagesDto } from "../dtos/threads/get-messages.dto";





export abstract class ChatThreadDatasource {

  abstract createThread(createThreadOptions: CreateThreadDto): Promise<ChatThreadEntity>

  abstract addMessage(addMessageOptions: AddMessageDto): Promise<MessageEntity>

  abstract getThreadByPhone({ phone }: { phone: string }): Promise<ChatThreadEntity | null>

  abstract getByThreadId(threadId: string): Promise<ChatThreadEntity | null>

  abstract addCustomer(openAiThreadId: string, customerId: string): Promise<ChatThreadEntity>

  abstract getThreads(getThreadsDto: GetThreadsDto): Promise<ChatThreadEntity[]>

  abstract getMessagesByThread(threadId: string, getMessageDto: GetMessagesDto): Promise<ChatThreadEntity | null>

  abstract getOrCreateByPhone(phoneWa: string): Promise<ChatThreadEntity>

  abstract setProcessing(chatThreadId: string, isProcessing: boolean): Promise<void>

  abstract findByPhone(phoneWa: string): Promise<ChatThreadEntity | null> 
}