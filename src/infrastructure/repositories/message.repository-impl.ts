import { BuildIdempotencyKeyOptions, OutboundMessageCreate, MessageDatasource } from '../../domain/datasource/message.datasource';
import { CreateAssistantMessageRequest } from '../../domain/dtos/messages/create-assistant-message-request.dto';
import { CreateUserMessageRequestDTO } from '../../domain/dtos/messages/create-user-message-request.dto';
import { MessageEntity } from '../../domain/entities/message.entity';
import { MessageRepository } from '../../domain/repositories/message-repository';
export class MessageRepositoryImpl implements MessageRepository {

  constructor(private readonly messageDatasource: MessageDatasource) { }

  buildIdempotencyKey(input: BuildIdempotencyKeyOptions): string {
    return this.messageDatasource.buildIdempotencyKey(input)
  }
  findByIdempotency(idem: string): Promise<MessageEntity> {
    return this.messageDatasource.findByIdempotency(idem)
  }
  createQueued(data: OutboundMessageCreate): Promise<MessageEntity> {
    return this.messageDatasource.createQueued(data)
  }
  markSent(id: string, providerMessageSid: string): Promise<MessageEntity> {
    return this.messageDatasource.markSent(id, providerMessageSid)
  }
  updateStatusByProviderSid(providerMessageSid: string, status: string, extra?: any): Promise<MessageEntity> {
    return this.messageDatasource.updateStatusByProviderSid(providerMessageSid, status, extra)
  }
  createUserMessage(request: CreateUserMessageRequestDTO): Promise<void> {
    return this.messageDatasource.createUserMessage(request)
  }
  createAssistantMessage(request: CreateAssistantMessageRequest): Promise<void> {
    return this.messageDatasource.createAssistantMessage(request)
  }

}