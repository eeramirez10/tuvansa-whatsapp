import { createHash } from 'node:crypto'
import OpenAI from 'openai'
import type {
  Response,
  ResponseCreateParamsBase,
  ResponseFunctionToolCall,
  ResponseInputItem
} from 'openai/resources/responses/responses'
import { envs } from '../../config/envs'
import {
  buildTuvansaAgentInstructions,
  TUVANSA_AGENT_TOOLS
} from '../../config/openai-agent.config'
import {
  ConversationHistoryMessage,
  LanguageModelService,
  LanguageModelToolOutput,
  LanguageModelTurn
} from '../../domain/services/language-model.service'
import { WhatsAppTurnContext } from '../../domain/interfaces/whatsapp-turn-context'

const MAX_IMPORTED_MESSAGES = 20
type OpenAIClient = Pick<OpenAI, 'conversations' | 'responses'>
type ResponsesModel = NonNullable<ResponseCreateParamsBase['model']>

export class OpenAIService implements LanguageModelService {
  constructor(
    private readonly openai: OpenAIClient = new OpenAI({ apiKey: envs.OPEN_API_KEY })
  ) { }

  async createConversation(history: ConversationHistoryMessage[] = []): Promise<string> {
    const items: ResponseInputItem[] = history
      .filter((message) => message.content.trim().length > 0)
      .slice(-MAX_IMPORTED_MESSAGES)
      .map((message) => ({
        type: 'message',
        role: message.role,
        content: message.content
      }))

    const conversation = await this.openai.conversations.create({
      items,
      metadata: {
        source: 'tuvansa-whatsapp'
      }
    })

    return conversation.id
  }

  async createResponse(options: {
    conversationId: string
    input: string
    endUserId: string
    context: WhatsAppTurnContext
  }): Promise<LanguageModelTurn> {
    const response = await this.openai.responses.create({
      model: envs.OPENAI_MODEL as ResponsesModel,
      conversation: options.conversationId,
      input: options.input,
      instructions: buildTuvansaAgentInstructions(options.context),
      tools: TUVANSA_AGENT_TOOLS,
      tool_choice: 'auto',
      parallel_tool_calls: false,
      max_output_tokens: 1200,
      safety_identifier: this.hashEndUserId(options.endUserId)
    })

    return this.toLanguageModelTurn(response)
  }

  async submitToolOutputs(options: {
    conversationId: string
    toolOutputs: LanguageModelToolOutput[]
    endUserId: string
    context: WhatsAppTurnContext
  }): Promise<LanguageModelTurn> {
    const input: ResponseInputItem[] = options.toolOutputs.map((toolOutput) => ({
      type: 'function_call_output',
      call_id: toolOutput.callId,
      output: toolOutput.output
    }))

    const response = await this.openai.responses.create({
      model: envs.OPENAI_MODEL as ResponsesModel,
      conversation: options.conversationId,
      input,
      instructions: buildTuvansaAgentInstructions(options.context),
      tools: TUVANSA_AGENT_TOOLS,
      tool_choice: 'auto',
      parallel_tool_calls: false,
      max_output_tokens: 1200,
      safety_identifier: this.hashEndUserId(options.endUserId)
    })

    return this.toLanguageModelTurn(response)
  }

  private toLanguageModelTurn(response: Response): LanguageModelTurn {
    if (response.status === 'failed') {
      throw new Error(response.error?.message ?? 'OpenAI response failed')
    }

    const toolCalls = response.output
      .filter((item): item is ResponseFunctionToolCall => item.type === 'function_call')
      .map((item) => ({
        callId: item.call_id,
        name: item.name,
        arguments: item.arguments
      }))

    return {
      responseId: response.id,
      outputText: response.output_text.trim(),
      toolCalls
    }
  }

  private hashEndUserId(endUserId: string): string {
    return createHash('sha256').update(endUserId).digest('hex')
  }
}
