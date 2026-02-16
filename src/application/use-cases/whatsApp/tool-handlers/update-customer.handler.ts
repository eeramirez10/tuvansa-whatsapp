import { ToolCallHandler, ToolCallOutput, ToolCallContext } from './tool-call-handler.interface';
import { UpdatedCustomerData } from '../../../../domain/interfaces/customer';
import { MessageService } from '../../../../domain/services/message.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UpdateCustomerHandler implements ToolCallHandler {
  constructor(private messageService: MessageService) {}

  canHandle(functionName: string): boolean {
    return functionName === 'update_customer_info';
  }

  async execute(context: ToolCallContext): Promise<ToolCallOutput> {
    const { phoneWa, action } = context;

    try {
      await this.messageService.createWhatsAppMessage({
        to: phoneWa,
        body: 'Vamos a actualizar tus datos',
      });

      const clientInfo = JSON.parse(action.function.arguments) as UpdatedCustomerData;
      const { customer_name, customer_lastname, email, phone, location, company } = clientInfo;

      const customer = await prisma.customer.findUnique({
        where: { phoneWa },
      });

      if (!customer) {
        await this.messageService.createWhatsAppMessage({
          to: phoneWa,
          body: 'Lo siento, aun no estas registrado con nosotros',
        });

        return {
          tool_call_id: action.id,
          output: JSON.stringify({
            success: false,
            msg: 'No se encontro al cliente en la BD',
          }),
        };
      }

      await prisma.customer.update({
        where: { phoneWa },
        data: {
          name: customer_name ?? customer.name,
          lastname: customer_lastname ?? customer.lastname,
          email: email ?? customer.email,
          phone: phone ?? customer.phone,
          location: location ?? customer.location,
          company: company ?? customer.company,
        },
      });

      await this.messageService.createWhatsAppMessage({
        to: phoneWa,
        body: 'Listo, tus datos quedaron actualizados ',
      });

      return {
        tool_call_id: action.id,
        output: JSON.stringify({
          success: true,
          msg: 'Actualizado correctamente',
        }),
      };
    } catch (error) {
      console.error('[UpdateCustomerHandler] Error:', error);

      await this.messageService.createWhatsAppMessage({
        to: phoneWa,
        body: 'Lo siento, hubo un error al actualizar tus datos, lo intentare mas tarde',
      });

      return {
        tool_call_id: action.id,
        output: JSON.stringify({
          success: false,
          msg: 'Error al actualizar al cliente',
        }),
      };
    }
  }
}
