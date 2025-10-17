import OpenAI from 'openai';
import { envs } from '../../config/envs';
import { openai } from '../../config/openai-config';
import { LanguageModelService } from '../../domain/services/language-model.service';
import { TwilioService } from './twilio.service';




export class OpenAIService implements LanguageModelService {

  private openai = new OpenAI({ apiKey: envs.OPEN_API_KEY })
  constructor(private readonly twilioService?: TwilioService) {
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



  async checkStatus(threadId: string, runId: string) {
    const runStatus = await this.openai.beta.threads.runs.retrieve(threadId, runId);
    // console.log({ status: runStatus.status });
    return runStatus;
  }

  async submitToolOutputs(threadId: string, runId: string, toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]) {

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

  async streamMessageToWhatsApp(options: {
    threadId: string;
    question: any[];
    to: string;
    assistantId?: string;  // ahora pasamos assistant_id
    chunkSize?: number;
  }) {


    const {
      threadId,
      question,
      to,
      assistantId = 'asst_zH28urJes1YILRhYUZrjjakE',  // asst_zH28urJes1YILRhYUZrjjakE tu assistant por defecto
      chunkSize = 200
    } = options;
    // 1) Enviar la pregunta
    await this.openai.beta.threads.messages.create(threadId, {
      role: 'user',
      content: question
    });

    // 2) Iniciar streaming
    const stream = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      stream: true
    });

    let buffer = '';



    for await (const event of stream) {
      if (event.event !== 'thread.message.delta') continue;

      const deltaParts = (event.data as any).delta.content as Array<{
        text: { value: string }
      }>;

      for (const part of deltaParts) {
        buffer += part.text.value;

        // console.log(buffer)

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          // Extraemos hasta el salto (sin incluir '\n')
          const toSend = buffer.slice(0, newlineIndex).trim();
          // Solo enviamos si no está vacío
          if (toSend) {
            await this.twilioService.createWhatsAppMessage({
              to,
              body: toSend
            });
          }
          // Quitamos lo ya enviado + el '\n'
          buffer = buffer.slice(newlineIndex + 1);

          await new Promise((resolve) => {
            return setTimeout(resolve, 800)
          })
        }
      }
    }

    // Al final, también validamos buffer remanente
    const remainder = buffer.trim();
    if (remainder) {
      await this.twilioService.createWhatsAppMessage({
        to,
        body: remainder
      });
    }

  }


  async startRunStream(opts: { threadId: string; assistantId?: string }) {
    const { threadId, assistantId } = opts;
    const stream = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
      stream: true
    });
    // El primer evento "thread.run.created" te da el runId en event.data.id
    let runId: string;
    const iterator = stream[Symbol.asyncIterator]();
    const first = await iterator.next();
    if (first.value.event === 'thread.run.created') {
      runId = first.value.data.id;
    } else {
      throw new Error('No se pudo obtener runId');
    }
    // Reemplazamos el primer evento en el stream para que siga fluyendo
    const newStream = (async function* () {
      yield first.value;
      yield* iterator as any;
    })();

    return { runId, stream: newStream };
  }





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