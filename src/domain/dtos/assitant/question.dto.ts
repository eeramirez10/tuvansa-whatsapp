
interface Options {
  threadId: string
  question: string
}

export class QuestionDto {

  readonly threadId: string
  readonly question: string

  constructor(options: Options) {
    this.threadId = options.threadId
    this.question = options.question
  }

}