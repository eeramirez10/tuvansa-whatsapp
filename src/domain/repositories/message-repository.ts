import { BuildIdempotencyKeyOptions, OutboundMessageCreate } from "../datasource/message.datasource";
import { CreateAssistantMessageRequest } from "../dtos/messages/create-assistant-message-request.dto";
import { CreateUserMessageRequestDTO } from "../dtos/messages/create-user-message-request.dto";
import { MessageEntity } from "../entities/message.entity";


export abstract class MessageRepository {

  abstract buildIdempotencyKey(input: BuildIdempotencyKeyOptions): string
  abstract findByIdempotency(idem: string): Promise<MessageEntity>
  abstract createQueued(data: OutboundMessageCreate): Promise<MessageEntity>
  abstract markSent(id: string, providerMessageSid: string): Promise<MessageEntity>
  abstract updateStatusByProviderSid(providerMessageSid: string, status: string, extra?: any): Promise<MessageEntity>
  abstract createUserMessage(request:CreateUserMessageRequestDTO):Promise<void>
  abstract createAssistantMessage(request:CreateAssistantMessageRequest):Promise<void>
}
