
interface Option {
  readonly id: string
  readonly fileKey: string
  readonly originalFilename?: string | null
  readonly buffer: Uint8Array<ArrayBuffer>
  readonly mimeType: string
}

export class FindFileByKeyResponseDTO {

  readonly id: string
  readonly fileKey: string
  readonly originalFilename?: string | null
  readonly buffer: Uint8Array<ArrayBuffer>
  readonly mimeType: string

  constructor(options: Option) {
    this.id = options.id
    this.fileKey = options.fileKey
    this.originalFilename = options.originalFilename
    this.buffer = options.buffer
    this.mimeType = options.mimeType
  }

}
