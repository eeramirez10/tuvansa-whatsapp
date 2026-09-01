import { WhatsAppTurnContext } from '../../../../domain/interfaces/whatsapp-turn-context'

export interface ToolCallContext {
  action: any;
  phoneWa: string;
  conversationId: string;
  chatThreadId: string;
  turnContext: WhatsAppTurnContext;
}

export interface ToolCallOutput {
  tool_call_id: string;
  output: string;
}

export interface ToolCallHandler {
  canHandle(functionName: string): boolean;
  execute(context: ToolCallContext): Promise<ToolCallOutput>;
}
