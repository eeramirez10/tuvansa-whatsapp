import OpenAI from "openai";

export abstract class LanguageModelService  {

  abstract createThread(): Promise<string>


  abstract createMessage({ threadId, question }: { threadId: string, question: string }): Promise<OpenAI.Beta.Threads.Messages.Message & {
    _request_id?: string | null;
}>

  abstract createRun({ threadId, assistantId }: { threadId: string, assistantId?: string }): Promise<OpenAI.Beta.Threads.Runs.Run & {
    _request_id?: string | null;
}>



  abstract checkStatus(threadId: string, runId: string):  Promise<OpenAI.Beta.Threads.Runs.Run & {
    _request_id?: string | null;
}>

  abstract submitToolOutputs(threadId: string, runId: string, toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[]): Promise<OpenAI.Beta.Threads.Runs.Run & {
    _request_id?: string | null;
}>

  abstract getMessageList(threadId: string): Promise<{
    role: "user" | "assistant";
    content: any[];
  }[]>




}