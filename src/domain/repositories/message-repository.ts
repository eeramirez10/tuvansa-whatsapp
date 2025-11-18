import { BuildIdempotencyKeyOptions, OutboundMessageCreate } from "../datasource/message.datasource";
import { MessageEntity } from "../entities/message.entity";


export abstract class MessageRepository {

  abstract buildIdempotencyKey(input: BuildIdempotencyKeyOptions): string
  abstract findByIdempotency(idem: string): Promise<MessageEntity>
  abstract createQueued(data: OutboundMessageCreate): Promise<MessageEntity>
  abstract markSent(id: string, providerMessageSid: string): Promise<MessageEntity>
  abstract updateStatusByProviderSid(providerMessageSid: string, status: string, extra?: any): Promise<MessageEntity>
}
