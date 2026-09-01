import { QuoteProductDraft } from '../../../../domain/interfaces/quote-product-draft'
import { QuoteProductValidator } from '../../../../domain/services/quote-product-validator'
import { ToolCallContext, ToolCallHandler, ToolCallOutput } from './tool-call-handler.interface'

export class ValidateQuoteItemsHandler implements ToolCallHandler {
  constructor(private readonly validator: QuoteProductValidator) { }

  canHandle(functionName: string): boolean {
    return functionName === 'validate_quote_items'
  }

  async execute(context: ToolCallContext): Promise<ToolCallOutput> {
    try {
      const { items = [] } = JSON.parse(context.action.function.arguments) as {
        items?: QuoteProductDraft[]
      }
      const validation = this.validator.validate(items)

      return {
        tool_call_id: context.action.id,
        output: JSON.stringify({
          success: true,
          validation: {
            valid: validation.valid,
            issues: validation.issues
          },
          acceptedItems: validation.valid ? items : []
        })
      }
    } catch (error) {
      return {
        tool_call_id: context.action.id,
        output: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'No fue posible validar los productos'
        })
      }
    }
  }
}
