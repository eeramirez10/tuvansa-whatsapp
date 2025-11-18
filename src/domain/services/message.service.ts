interface SendWhatsAppMessageOptions {
  body?: string
  to: string
  mediaUrl?: string[]
  contentSid?: string
  contentVariables?: string
}

export interface SaveFilesDto {
  mediaUrl: string
  filename: string
  mediaSid: string
  MessageSid: string
}

export interface DeleteFileDto {
  MessageSid: string
  mediaSid: string
}

export type WhatsAppSendMediaParams = {
  to: string;                  // "whatsapp:+52155..."
  from?: string;                // "whatsapp:+1..."
  body?: string;               // Texto opcional
  mediaUrl: string;            // Presigned URL PDF
  filename?: string;           // Nombre sugerido (opcional)
  statusCallbackUrl?: string;  // webhook para Twilio callbacks
};

export type WhatsAppSendMediaResult = {
  providerMessageSid: string;
};


export abstract class MessageService {

  abstract createWhatsAppMessage(options: SendWhatsAppMessageOptions): Promise<WhatsAppSendMediaResult>

  abstract saveFiles(options: SaveFilesDto): Promise<void>

  abstract deleteFileFromApi(options: DeleteFileDto): Promise<void>

  abstract getFileFromUrl(mediaUrl: string): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>>

  abstract sendMediaMessage(options: WhatsAppSendMediaParams): Promise<WhatsAppSendMediaResult>

}