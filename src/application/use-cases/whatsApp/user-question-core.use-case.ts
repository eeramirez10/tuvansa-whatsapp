import {
  LanguageModelService,
  LanguageModelToolOutput
} from '../../../domain/services/language-model.service'
import { MessageService } from '../../../domain/services/message.service'
import { MessageRepository } from '../../../domain/repositories/message-repository'
import { ToolCallHandlerFactory } from './tool-handlers/tool-call-handler.factory'
import { splitWhatsAppMessage } from './whatsapp-message-chunker'

interface CoreOptions {
  phoneWa: string
  question: string
  conversationId: string
  chatThreadId: string
}

const MAX_TOOL_ROUNDS = 8

export class UserQuestionCoreUseCase {
  constructor(
    public readonly openaiService: LanguageModelService,
    private readonly messageService: MessageService,
    private readonly toolCallHandlerFactory: ToolCallHandlerFactory,
    private readonly messageRepository: MessageRepository
  ) { }

  async execute(options: CoreOptions): Promise<void> {
    const { phoneWa, question, conversationId, chatThreadId } = options

    try {
      await this.messageRepository.createUserMessage({
        content: question,
        chatThreadId,
        from: phoneWa
      })

      let turn = await this.openaiService.createResponse({
        conversationId,
        input: question,
        endUserId: phoneWa
      })

      let toolRound = 0

      while (turn.toolCalls.length > 0) {
        toolRound += 1
        if (toolRound > MAX_TOOL_ROUNDS) {
          throw new Error(`OpenAI exceeded ${MAX_TOOL_ROUNDS} tool-call rounds`)
        }

        const toolOutputs: LanguageModelToolOutput[] = []

        for (const toolCall of turn.toolCalls) {
          const handler = this.toolCallHandlerFactory.getHandler(toolCall.name)

          if (!handler) {
            toolOutputs.push({
              callId: toolCall.callId,
              output: JSON.stringify({
                success: false,
                error: `Unsupported tool: ${toolCall.name}`
              })
            })
            continue
          }

          const result = await handler.execute({
            action: {
              id: toolCall.callId,
              function: {
                name: toolCall.name,
                arguments: toolCall.arguments
              }
            },
            phoneWa,
            conversationId,
            chatThreadId
          })

          toolOutputs.push({
            callId: toolCall.callId,
            output: result.output
          })
        }

        turn = await this.openaiService.submitToolOutputs({
          conversationId,
          toolOutputs,
          endUserId: phoneWa
        })
      }

      if (turn.outputText) {
        await this.sendAssistantResponse({
          content: turn.outputText,
          phoneWa,
          chatThreadId
        })
      }
    } catch (error) {
      console.error('[UserQuestionCoreUseCase]', error)
      throw new Error('[UserQuestionCore] error', { cause: error })
    }
  }

  private async sendAssistantResponse(options: {
    content: string
    phoneWa: string
    chatThreadId: string
  }): Promise<void> {
    for (const content of splitWhatsAppMessage(options.content)) {
      const result = await this.messageService.createWhatsAppMessage({
        to: options.phoneWa,
        body: content
      })

      await this.messageRepository.createAssistantMessage({
        content,
        chatThreadId: options.chatThreadId,
        to: options.phoneWa,
        providerMessageId: result.providerMessageSid,
        status: 'QUEUED'
      })
    }
  }
}
