
interface Option {
  fileKey: string;
  chatThreadId: string;
}

export class FindFileByKeyRequestDTO {

  readonly fileKey: string;
  readonly chatThreadId: string;

  constructor(options:Option){
    this.fileKey = options.fileKey
    this.chatThreadId = options.chatThreadId
  }

}