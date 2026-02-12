
interface Options {

  fileBuffer: ArrayBuffer
  filename: string
  mimeType: string
  chatThreadId: string

}


export class SaveTemporaryFileRequestDTO {
  readonly fileBuffer: ArrayBuffer
  readonly filename: string
  readonly mimeType: string
  readonly chatThreadId: string

  constructor(options: Options) {
    this.fileBuffer = options.fileBuffer
    this.filename = options.filename
    this.mimeType = options.mimeType
    this.chatThreadId = options.chatThreadId
  }

}