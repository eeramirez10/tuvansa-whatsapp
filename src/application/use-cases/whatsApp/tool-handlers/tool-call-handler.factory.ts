import { ToolCallHandler } from "./tool-call-handler.interface";
import { UpdateCustomerHandler } from "./update-customer.handler";
import { GetBranchesHandler } from "./get-branches.handler";
import { ValidateQuoteItemsHandler } from './validate-quote-items.handler';
import { CreateQuoteRequestHandler } from './create-quote-request.handler';
import { CustomerRepository } from '../../../../domain/repositories/customer.repository';
import { QuoteRepository } from "../../../../domain/repositories/quote.repository";
import { FileRepository } from "../../../../domain/repositories/file.repository";
import { ChatThreadRepository } from "../../../../domain/repositories/chat-thread.repository";
import { BranchRepository } from "../../../../domain/repositories/branch.repository";
import { FileStorageService } from "../../../../domain/services/file-storage.service";
import { MessageService } from "../../../../domain/services/message.service";
import { MessageRepository } from '../../../../domain/repositories/message-repository';
import { UserRepository } from "../../../../domain/repositories/user-repository";
import { QuoteProductValidator } from '../../../../domain/services/quote-product-validator';


export class ToolCallHandlerFactory {
  private handlers: ToolCallHandler[] = [];

  constructor(
    // Repositories
    private readonly customerRepository: CustomerRepository,
    private readonly quoteRepository: QuoteRepository,
    private readonly fileRepository: FileRepository,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly branchRepository: BranchRepository,
    private readonly userRepository: UserRepository,
    private readonly messageRepository: MessageRepository,
   

    // Services
    private readonly messageService: MessageService,
    private readonly fileStorageService: FileStorageService,
  ) {
    this.initializeHandlers();
  }

  /**
   * Initialize all available handlers with their dependencies
   */
  private initializeHandlers(): void {
    const validator = new QuoteProductValidator();
    const createQuoteRequestHandler = new CreateQuoteRequestHandler(
      this.quoteRepository,
      this.customerRepository,
      this.chatThreadRepository,
      this.branchRepository,
      this.fileRepository,
      this.fileStorageService,
      this.messageService,
      this.messageRepository,
      this.userRepository,
      validator
    );


    const updateCustomerHandler = new UpdateCustomerHandler(
      this.messageService,
      this.customerRepository
    );


    const getBranchesHandler = new GetBranchesHandler(
      this.branchRepository
    );

    const validateQuoteItemsHandler = new ValidateQuoteItemsHandler(validator);

    // Register all handlers
    this.handlers = [
      getBranchesHandler,
      validateQuoteItemsHandler,
      updateCustomerHandler,
      createQuoteRequestHandler
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
      'get_branches',
      'validate_quote_items',
      'update_customer_info',
      'create_quote_request'
    ];
  }
}
