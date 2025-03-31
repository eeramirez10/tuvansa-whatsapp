
import { AddMessageDto } from "../dtos/add-message.dto";
import { CreateThreadDto } from "../dtos/create-thread.dto"
import { ChatThreadEntity } from "../entities/chat-thread.entity";
import { MessageEntity } from "../entities/message.entity";





export abstract class ChatThreadDatasource {

  abstract createThread(createThreadOptions: CreateThreadDto): Promise<ChatThreadEntity>

  abstract addMessage(addMessageOptions: AddMessageDto): Promise<MessageEntity>

  abstract getThreadByPhone({ phone }: { phone: string }): Promise<ChatThreadEntity | null>

  abstract getByThreadId(threadId: string): Promise<ChatThreadEntity | null>

  abstract addCustomer(openAiThreadId: string, customerId: string): Promise<ChatThreadEntity>

  abstract getThreads(): Promise<ChatThreadEntity[]>

  abstract getMessagesByThread(threadId: string): Promise<ChatThreadEntity | null>

}