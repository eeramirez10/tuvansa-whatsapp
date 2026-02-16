export interface ToolCallContext {
  action: any;
  phoneWa: string;
  threadId: string;
  chatThreadId: string;
}

export interface ToolCallOutput {
  tool_call_id: string;
  output: string;
}

export interface ToolCallHandler {
  canHandle(functionName: string): boolean;
  execute(context: ToolCallContext): Promise<ToolCallOutput>;
}
