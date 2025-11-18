import { MessageEntity } from "../entities/message.entity";

export type OutboundMessageCreate = {
  quoteId: string;
  quoteVersionId: string;
  artifactId: string;
  to: string;
  from: string;
  channel: "WHATSAPP";
  direction: "OUTBOUND";
  body?: string | null;
  media: Array<{ type: string; url: string; filename?: string }>;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  chatThreadId: string
};

export type BuildIdempotencyKeyOptions = {
  to: string;
  quoteVersionId: string;
  artifactId: string;
  fileKey: string;
}

export abstract class MessageDatasource {


  abstract buildIdempotencyKey(input: BuildIdempotencyKeyOptions): string

  abstract findByIdempotency(idem: string): Promise<MessageEntity>

  abstract createQueued(data: OutboundMessageCreate): Promise<MessageEntity>
  abstract markSent(id: string, providerMessageSid: string): Promise<MessageEntity>

  abstract updateStatusByProviderSid(providerMessageSid: string, status: string, extra?: any): Promise<MessageEntity>
}
