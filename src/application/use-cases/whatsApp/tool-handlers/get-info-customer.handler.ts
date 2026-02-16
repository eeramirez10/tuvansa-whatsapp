import { ToolCallHandler, ToolCallContext } from "./tool-call-handler.interface";
import { CustomerRepository } from '../../../../domain/repositories/customer.repository';

export class GetInfoCustomerHandler implements ToolCallHandler {

  constructor(
    private readonly customerRepository: CustomerRepository
  ) { }

  canHandle(functionName: string): boolean {
    return functionName === 'get_info_customer';
  }

  async execute(context: ToolCallContext): Promise<any> {
    const { action, phoneWa } = context;

    console.log('[GetInfoCustomerHandler] Fetching customer info for:', phoneWa);

    try {
      // Query customer by phone number
      const customer = await this.customerRepository.findByWhatsappPhone(phoneWa);

      console.log('[GetInfoCustomerHandler] Customer found:', !!customer);

      // Customer not found
      if (!customer) {
        const payload = {
          exists: false,
          customer: null
        };

        return {
          tool_call_id: action.id,
          output: JSON.stringify(payload)
        };
      }

      // Customer found - format response
      const payload = {
        exists: true,
        customer: {
          customer_name: customer.name,
          customer_lastname: customer.lastname,
          email: customer.email,
          phone: customer.phone,
          location: customer.location,
          company: customer.company ?? '',
        }
      };

      console.log('[GetInfoCustomerHandler] Returning customer payload');

      return {
        tool_call_id: action.id,
        output: JSON.stringify(payload)
      };

    } catch (error) {
      console.error('[GetInfoCustomerHandler] Error fetching customer:', error);

      return {
        tool_call_id: action.id,
        output: JSON.stringify({
          exists: false,
          customer: null,
          error: 'Error al obtener información del cliente'
        })
      };
    }
  }
}
