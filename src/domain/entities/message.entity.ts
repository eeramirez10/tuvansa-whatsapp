// src/entities/message.entity.ts

import { JsonValue } from "@prisma/client/runtime/library";

// 🔹 Enums de transporte (coinciden con tu schema Prisma)
export type Channel = 'WHATSAPP' | 'WEB' | 'EMAIL'
export type Direction = 'INBOUND' | 'OUTBOUND'

// 🔹 Tipos auxiliares
export interface MessageMedia {
  type: string;              // p.ej. "PDF", "IMAGE"
  fileKey: string;           // S3 key
  mimeType?: string;
  url?: string;              // si usas URL pública
}

export interface MessageOptions {
  id: string;
  role: string;              // "user" | "assistant"
  content: string;
  createdAt: Date;
  chatThreadId: string;

  // === opcionales nuevos (omnicanal / envío de cotización) ===
  channel?: Channel;         // default: 'WHATSAPP'
  direction?: Direction;     // INBOUND/OUTBOUND
  from?: string | null;      // E.164 emisor (inbound)
  to?: string | null;        // E.164 receptor (outbound)

  provider?: string | null;              // "TWILIO"
  providerMessageId?: string | null;     // MessageSid
  status?: string | null;                // queued|sent|delivered|read|failed
  errorCode?: string | null;

  quoteId?: string | null;
  quoteVersionId?: string | null;
  quoteArtifactId?: string | null;

  templateCode?: string | null;
  contentSid?: string | null;
  variables?: unknown | null;            // JSON variables de plantilla
  media?: JsonValue | null;         // adjuntos enviados

  idempotencyKey?: string | null;
}

export class MessageEntity {
  readonly id: string;
  readonly role: string;
  readonly content: string;
  readonly createdAt: Date;
  readonly chatThreadId: string;

  // opcionales
  readonly channel?: Channel;
  readonly direction?: Direction;
  readonly from?: string | null;
  readonly to?: string | null;

  readonly provider?: string | null;
  readonly providerMessageId?: string | null;
  readonly status?: string | null;
  readonly errorCode?: string | null;

  readonly quoteId?: string | null;
  readonly quoteVersionId?: string | null;
  readonly quoteArtifactId?: string | null;

  readonly templateCode?: string | null;
  readonly contentSid?: string | null;
  readonly variables?: unknown | null;
  readonly media?: JsonValue | null;

  readonly idempotencyKey?: string | null;


  constructor(options: MessageOptions) {
    this.id = options.id;
    this.role = options.role;
    this.content = options.content;
    this.createdAt = options.createdAt;
    this.chatThreadId = options.chatThreadId;


    this.channel = options.channel ?? 'WHATSAPP';
    this.direction = options.direction; 
    this.from = options.from ?? null;
    this.to = options.to ?? null;

    this.provider = options.provider ?? null;
    this.providerMessageId = options.providerMessageId ?? null;
    this.status = options.status ?? null;
    this.errorCode = options.errorCode ?? null;

    this.quoteId = options.quoteId ?? null;
    this.quoteVersionId = options.quoteVersionId ?? null;
    this.quoteArtifactId = options.quoteArtifactId ?? null;

    this.templateCode = options.templateCode ?? null;
    this.contentSid = options.contentSid ?? null;
    this.variables = options.variables ?? null;
    this.media = options.media ?? null;

    this.idempotencyKey = options.idempotencyKey ?? null;
  }

}
