import { FileRepository } from "../../../../domain/repositories/file.repository";
import { FileStorageService } from "../../../../domain/services/file-storage.service";
import { ProcessFileForQuoteUseCase } from "../../file/process-file-for-quote.use-case";
import { ToolCallHandler, ToolCallContext } from "./tool-call-handler.interface";


export class ProcessFileHandler implements ToolCallHandler {
  
  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly fileRepository: FileRepository
  ) {}

  canHandle(functionName: string): boolean {
    return functionName === 'process_file_for_quote';
  }

  async execute(context: ToolCallContext): Promise<any> {
    const { action, chatThreadId } = context;

    console.log('[ProcessFileHandler] Processing file for chat thread:', chatThreadId);

    try {
      // Parse function arguments to get file_key
      const { file_key } = JSON.parse(action.function.arguments);

      if (!file_key) {
        throw new Error('file_key is required');
      }

      console.log('[ProcessFileHandler] Processing file:', file_key);

      // Execute the use case to process the file
      await new ProcessFileForQuoteUseCase(
        this.fileStorageService,
        this.fileRepository
      ).execute({ 
        fileKey: file_key, 
        chatThreadId 
      });

      console.log('[ProcessFileHandler] File processed successfully:', file_key);

      return {
        tool_call_id: action.id,
        output: JSON.stringify({
          success: true,
          message: `Archivo ${file_key} procesado correctamente`
        })
      };

    } catch (error) {
      console.error('[ProcessFileHandler] Error processing file:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Error desconocido al procesar el archivo';

      // Return error payload for graceful handling
      return {
        tool_call_id: action.id,
        output: JSON.stringify({
          success: false,
          message: `Error al procesar el archivo: ${errorMessage}`
        })
      };
    }
  }
}
