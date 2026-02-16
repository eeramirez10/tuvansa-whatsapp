import { PrismaClient } from "@prisma/client";
import { ToolCallHandler } from "./tool-call-handler.interface";
import { ExtractCustomerHandler } from "./extract-customer.handler";
import { UpdateCustomerHandler } from "./update-customer.handler";
import { GetInfoCustomerHandler } from "./get-info-customer.handler";
import { GetBranchesHandler } from "./get-branches.handler";
import { ProcessFileHandler } from "./process-file.handler";
import { CustomerRepository } from '../../../../domain/repositories/customer.repository';
import { QuoteRepository } from "../../../../domain/repositories/quote.repository";
import { FileRepository } from "../../../../domain/repositories/file.repository";
import { ChatThreadRepository } from "../../../../domain/repositories/chat-thread.repository";
import { BranchRepository } from "../../../../domain/repositories/branch.repository";
import { FileStorageService } from "../../../../domain/services/file-storage.service";
import { MessageService } from "../../../../domain/services/message.service";
import { ContactService } from "../../../../infrastructure/services/contacts.service";
import { OpenAiFunctinsService } from "../../../../infrastructure/services/openai-functions.service";
import { MessageRepository } from '../../../../domain/repositories/message-repository';


export class ToolCallHandlerFactory {
  private handlers: ToolCallHandler[] = [];

  constructor(
    // Repositories
    private readonly customerRepository: CustomerRepository,
    private readonly quoteRepository: QuoteRepository,
    private readonly fileRepository: FileRepository,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly branchRepository: BranchRepository,
    private readonly messageRepository: MessageRepository,
   

    // Services
    private readonly messageService: MessageService,
    private readonly contactService: ContactService,
    private readonly fileStorageService: FileStorageService,
    private readonly openAiFunctions: OpenAiFunctinsService,
  ) {
    this.initializeHandlers();
  }

  /**
   * Initialize all available handlers with their dependencies
   */
  private initializeHandlers(): void {
    // Extract Customer Handler - most complex (quote creation + notifications)
    const extractCustomerHandler = new ExtractCustomerHandler(
      this.quoteRepository,
      this.customerRepository,
      this.chatThreadRepository,
      this.branchRepository,
      this.messageService,
      this.messageRepository
    );


    const updateCustomerHandler = new UpdateCustomerHandler(
      this.messageService
    );


    const getInfoCustomerHandler = new GetInfoCustomerHandler(
      this.customerRepository
    );


    const getBranchesHandler = new GetBranchesHandler(
      this.branchRepository
    );


    const processFileHandler = new ProcessFileHandler(
      this.fileStorageService,
      this.fileRepository
    );

    // Register all handlers
    this.handlers = [
      extractCustomerHandler,
      updateCustomerHandler,
      getInfoCustomerHandler,
      getBranchesHandler,
      processFileHandler
    ];

    console.log('[ToolCallHandlerFactory] Initialized', this.handlers.length, 'handlers');
  }


  getHandler(functionName: string): ToolCallHandler | null {
    const handler = this.handlers.find(h => h.canHandle(functionName));

    if (!handler) {
      console.warn('[ToolCallHandlerFactory] No handler found for function:', functionName);
      return null;
    }

    console.log('[ToolCallHandlerFactory] Found handler for function:', functionName);
    return handler;
  }

  /**
   * Get all registered handler names for debugging/logging
   */
  getRegisteredHandlers(): string[] {
    return [
      'extract_customer_info',
      'update_customer_info',
      'get_info_customer',
      'get_branches',
      'process_file_for_quote'
    ];
  }
}
