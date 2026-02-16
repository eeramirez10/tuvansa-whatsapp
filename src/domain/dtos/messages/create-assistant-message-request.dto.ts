


interface Option {
  content: string
  chatThreadId: string
  to: string
}

export class CreateAssistantMessageRequest {
 readonly content: string
  readonly chatThreadId: string
  readonly to: string

  constructor(option: Option) {
    this.content = option.content
    this.chatThreadId = option.chatThreadId
    this.to = option.to
  }

}