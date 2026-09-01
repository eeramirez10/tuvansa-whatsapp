import { WhatsAppTurnContext } from '../interfaces/whatsapp-turn-context'

export interface ConversationHistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LanguageModelToolCall {
  callId: string
  name: string
  arguments: string
}

export interface LanguageModelToolOutput {
  callId: string
  output: string
}

export interface LanguageModelTurn {
  responseId: string
  outputText: string
  toolCalls: LanguageModelToolCall[]
}

export abstract class LanguageModelService {
  abstract createConversation(history?: ConversationHistoryMessage[]): Promise<string>

  abstract createResponse(options: {
    conversationId: string
    input: string
    endUserId: string
    context: WhatsAppTurnContext
  }): Promise<LanguageModelTurn>

  abstract submitToolOutputs(options: {
    conversationId: string
    toolOutputs: LanguageModelToolOutput[]
    endUserId: string
    context: WhatsAppTurnContext
  }): Promise<LanguageModelTurn>
}
