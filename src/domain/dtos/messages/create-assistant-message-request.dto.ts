


interface Option {
  content: string
  chatThreadId: string
  to: string
  providerMessageId?: string
  status?: string
  errorCode?: string
}

export class CreateAssistantMessageRequest {
 readonly content: string
  readonly chatThreadId: string
  readonly to: string
  readonly providerMessageId?: string
  readonly status?: string
  readonly errorCode?: string

  constructor(option: Option) {
    this.content = option.content
    this.chatThreadId = option.chatThreadId
    this.to = option.to
    this.providerMessageId = option.providerMessageId
    this.status = option.status
    this.errorCode = option.errorCode
  }

}
