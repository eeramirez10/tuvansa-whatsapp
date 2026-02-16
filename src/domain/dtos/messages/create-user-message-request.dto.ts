import { Channel, Direction } from "@prisma/client"


interface Option {
  content: string
  chatThreadId: string
  from: string
}




export class CreateUserMessageRequestDTO {

  readonly content: string
  readonly chatThreadId: string
  readonly from: string

  constructor(options: Option) {
    this.content = options.content
    this.chatThreadId = options.chatThreadId
    this.from = options.from
  }
}