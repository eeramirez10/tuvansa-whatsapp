
interface Options {
  id: string
  fileKey: string
  originalFilename?: string | null
  buffer: Buffer
  mimeType: string
  chatThreadId: string
  chatThread: string
  createdAt: string
  updatedAt: string

}
export class TemporaryFileEntity {

  readonly id: string
  readonly fileKey: string
  readonly originalFilename?: string | null
  readonly buffer: Buffer
  readonly mimeType: string
  readonly chatThreadId: string
  readonly chatThread: string
  readonly createdAt: string
  readonly updatedAt: string

  constructor(options: Options) {
    this.id = options.id
    this.fileKey = options.fileKey
    this.originalFilename = options.originalFilename
    this.buffer = options.buffer
    this.mimeType = options.mimeType
    this.chatThreadId = options.chatThreadId
    this.chatThread = options.chatThread
    this.createdAt = options.createdAt
    this.updatedAt = options.updatedAt
  }


}
