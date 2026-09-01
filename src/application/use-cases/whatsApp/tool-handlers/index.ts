/**
 * Tool Call Handlers for OpenAI Responses API functions
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

// Function handlers
export { UpdateCustomerHandler } from './update-customer.handler';
export { GetBranchesHandler } from './get-branches.handler';
export { ValidateQuoteItemsHandler } from './validate-quote-items.handler';
export { CreateQuoteRequestHandler } from './create-quote-request.handler';
