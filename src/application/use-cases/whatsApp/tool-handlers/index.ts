/**
 * Tool Call Handlers for OpenAI Assistant Functions
 * 
 * This module provides a Strategy pattern implementation for handling
 * different OpenAI function calls in the WhatsApp conversation flow.
 * 
 * Each handler implements the ToolCallHandler interface and is responsible
 * for processing a specific OpenAI function call type.
 */

// Core interface and types
export { ToolCallHandler, ToolCallContext } from './tool-call-handler.interface';

// Factory
export { ToolCallHandlerFactory } from './tool-call-handler.factory';

// Utility handlers
export { StreamMessageProcessor } from './stream-message-processor';

// Function handlers
export { ExtractCustomerHandler } from './extract-customer.handler';
export { UpdateCustomerHandler } from './update-customer.handler';
export { GetInfoCustomerHandler } from './get-info-customer.handler';
export { GetBranchesHandler } from './get-branches.handler';
export { ProcessFileHandler } from './process-file.handler';
