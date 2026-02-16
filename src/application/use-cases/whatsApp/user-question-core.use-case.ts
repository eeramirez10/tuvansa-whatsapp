import { PrismaClient } from "@prisma/client";
import { LanguageModelService } from "../../../domain/services/language-model.service";
import { MessageService } from "../../../domain/services/message.service";
import { ToolCallHandlerFactory } from './tool-handlers/tool-call-handler.factory';
import { StreamMessageProcessor } from './tool-handlers/stream-message-processor';
import { MessageRepository } from '../../../domain/repositories/message-repository';



interface CoreOptions {
  phoneWa: string;
  question: string;
  threadId: string;
  chatThreadId: string;

}

const prisma = new PrismaClient

export type FunctionNameType = 'extract_customer_info' | 'update_customer_info' | 'get_info_customer' | 'get_branches' | 'process_file_for_quote';

export class UserQuestionCoreUseCase {

  constructor(
    public readonly openaiService: LanguageModelService,
    private readonly messageService: MessageService,
    private readonly toolCallHandlerFactory: ToolCallHandlerFactory,
    private readonly messageRepository: MessageRepository

  ) { }


  async execute(options: CoreOptions) {


    let usedGetInfoCustomer = false

    const { phoneWa, question, threadId, chatThreadId } = options


    try {


      await this.messageRepository.createUserMessage({
        content: question,
        chatThreadId,
        from: phoneWa
      })


      await this.openaiService.createMessage({ threadId, question })

      const runStream = await this.openaiService.startRunStream({ threadId, assistantId: 'asst_zH28urJes1YILRhYUZrjjakE' })

      const { runId, stream } = runStream;

      // Process stream using StreamMessageProcessor
      const streamProcessor = new StreamMessageProcessor(
        this.messageService,
        chatThreadId,
        phoneWa
      );
      await streamProcessor.processStream(stream);




      while (true) {


        const runstatus = await this.openaiService.checkStatus(threadId, runId);

        if (runstatus.status === 'completed') break;

        if (runstatus.status === 'requires_action') {
          const requiredAction =
            runstatus.required_action?.submit_tool_outputs.tool_calls;

          if (!requiredAction) break;

          const tool_outputs = await Promise.all(
            requiredAction.map(async (action) => {
              const functionName: FunctionNameType =
                action.function.name as FunctionNameType;

              console.log('[UserQuestionCoreUseCase] Processing function:', functionName);

              const handler = this.toolCallHandlerFactory.getHandler(functionName);

              if (!handler) {
                console.warn('[UserQuestionCoreUseCase] No handler found for:', functionName);
                return { tool_call_id: action.id, output: '{success: false, error: "Handler not found"}' };
              }

              if (['get_info_customer', 'update_customer_info', 'get_branches', 'process_file_for_quote'].includes(functionName)) {
                usedGetInfoCustomer = true;
              }

              const result = await handler.execute({
                action,
                phoneWa,
                threadId,
                chatThreadId
              });

              return result;
            }),
          );

          await this.openaiService.submitToolOutputs(
            runstatus.thread_id,
            runstatus.id,
            tool_outputs,
          );

        }

        await new Promise((resolve) => setTimeout(resolve, 3500));
      }

      // Obtener y enviar respuesta final del asistente si usó get_info_customer
      const text = await this.getLastConversationAsistant(threadId)

      console.log({ text })

      if (text && usedGetInfoCustomer) {
        await this.messageService.createWhatsAppMessage({
          to: phoneWa,
          body: text,
        });

        await this.messageRepository.createAssistantMessage({
          content: text,
          chatThreadId,
          to: phoneWa,
        })

        // await prisma.message.create({
        //   data: {
        //     role: 'assistant',
        //     content: text,
        //     chatThreadId,
        //     channel: 'WHATSAPP',
        //     direction: 'OUTBOUND',
        //     to: phoneWa,
        //   },
        // });
      }


    } catch (error) {

      console.log(error)

      throw new Error('[UserQuestionCore]error')

    }

  }

  private async getLastConversationAsistant(threadId: string) {

    const messages = await this.openaiService.getMessageList(threadId);

    // Ajusta esto según el shape que te regrese getMessageList

    const ordered = [...messages].sort((a, b) => a.created_at - b.created_at)
    const lastAssistant = ordered.filter((data) => data.role === 'assistant').at(-1)



    return lastAssistant.content[0]

  }
}