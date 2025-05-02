interface SendWhatsAppMessageOptions {
  body: any[]
  to: string
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

export abstract class MessageService {

  abstract createWhatsAppMessage(options: SendWhatsAppMessageOptions): Promise<void>

  abstract saveFiles(options: SaveFilesDto): Promise<void>

  abstract deleteFileFromApi(options: DeleteFileDto): Promise<void>

  abstract getFileFromUrl(mediaUrl: string): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>>

}