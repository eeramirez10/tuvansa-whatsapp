import OpenAI from 'openai';
import { envs } from '../../config/envs';
import { openai } from '../../config/openai-config';
import { LanguageModelService } from '../../domain/services/language-model.service';




export class OpenAIService implements LanguageModelService {

  private openai = new OpenAI({ apiKey: envs.OPEN_API_KEY })
  constructor() {
  }

  // async createThread({ phone }: { phone: string }) {

  //   const createThread = new createThreadUseCase({
  //     openAi: this.openai,
  //     chatThreadRepository: this.chatThreadRepository
  //   })
  //     .execute({ phone })

  //   return await createThread
  // }

  async createThread() {

    const { id: threadId } = await this.openai.beta.threads.create()

    return threadId;
  }


  async createMessage({ threadId, question }: { threadId: string, question: string }) {

    const message = await openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: question
    })

    return message;
  }

  async createRun({ threadId, assistantId = 'asst_zH28urJes1YILRhYUZrjjakE' }: { threadId: string, assistantId?: string }) {


    const run = await openai.beta.threads.runs.create(threadId, { assistant_id: assistantId })

    return run
  }

  // async userQuestion(questionDto: QuestionDto) {
  //   const { threadId, question } = questionDto

  //   const message = await createMessageUseCase(this.openai, { threadId, question })


  //   const run = await createRunUseCase(this.openai, { threadId });

  //   await new CheckCompleteStatusUseCase(openai, this.quoteRepository, this.customerRepository, emailService).execute({ runId: run.id, threadId })

  //   const messages = await getMessageListUseCase(this.openai, { threadId })

  //   const chatThread = await this.chatThreadRepository.getByThreadId(threadId)

  //   if (chatThread?.id) await new SaveHistoryChatUseCase(this.chatThreadRepository).execute({ messages, threadId: chatThread?.id })


  //   return messages
  // }

  async checkStatus(threadId: string, runId: string) {
    const runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    console.log({ status: runStatus.status });
    return runStatus;
  }

  async submitToolOutputs(threadId:string, runId:string, toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] ){
    
    return await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs: toolOutputs });
  }

  async getMessageList(threadId: string) {

  

    const messageList = await this.openai.beta.threads.messages.list(threadId)


    const messages = messageList.data.map(message => ({
      role: message.role,
      content: message.content.map(content => (content as any).text.value)
    }))

    return messages

  }



}