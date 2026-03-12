import { ToolCallHandler, ToolCallOutput, ToolCallContext } from './tool-call-handler.interface';
import { QuoteNotificationEvent } from '../../../../domain/enums/notification.enum';
import { ExtractedData } from '../../../../domain/interfaces/customer';
import { SaveCustomerQuoteUseCase } from '../../save-customer-quote.use-case';
import { SummarizeConversationUseCase } from '../../messages/summarize-conversation.use-case';
import { QuoteRepository } from '../../../../domain/repositories/quote.repository';
import { CustomerRepository } from '../../../../domain/repositories/customer.repository';
import { ChatThreadRepository } from '../../../../domain/repositories/chat-thread.repository';
import { MessageService } from '../../../../domain/services/message.service';
import { UpdateQuoteDto } from '../../../../domain/dtos/quotes/update-quote.dto';
import { OpenAiFunctinsService } from '../../../../infrastructure/services/openai-functions.service';
import { MessageRepository } from '../../../../domain/repositories/message-repository';
import { UserRepository } from '../../../../domain/repositories/user-repository';
import { DispatchQuoteNotificationsUseCase } from '../dispatch-quote-notifications.use-case';



export class ExtractCustomerHandler implements ToolCallHandler {
  private newCustomerQuote: any = null;

  constructor(
    private quoteRepository: QuoteRepository,
    private customerRepository: CustomerRepository,
    private chatThreadRepository: ChatThreadRepository,
    private messageService: MessageService,
    private messageRepository: MessageRepository,
    private userRepository: UserRepository
  ) { }

  canHandle(functionName: string): boolean {
    return functionName === 'extract_customer_info';
  }

  async execute(context: ToolCallContext): Promise<ToolCallOutput> {
    const { phoneWa, threadId, chatThreadId, action } = context;

    try {
      

      const proccessMesagge = 'Perfecto, dame un momento en lo que genero tu solicitud...'
      await this.messageService.createWhatsAppMessage({
        to: phoneWa,
        body: proccessMesagge,
      });


      await this.messageRepository.createAssistantMessage({
        content: proccessMesagge,
        chatThreadId,
        to: phoneWa,
      })

      const clientInfo = JSON.parse(action.function.arguments) as ExtractedData;

      const {
        customer_name,
        customer_lastname,
        email,
        phone,
        location,
        items = [],
        file_key,
        company,
        branch_id,
      } = clientInfo;

      console.log({ clientInfo })

      // Crear cotización
      const saveCustomerQuote = new SaveCustomerQuoteUseCase(
        this.quoteRepository,
        this.customerRepository
      );

      this.newCustomerQuote = await saveCustomerQuote.execute({
        name: customer_name,
        lastname: customer_lastname,
        email,
        phone,
        phoneWa,
        location,
        items,
        fileKey: file_key,
        company,
        branchId: branch_id,
      });

      // Vincular cliente con chat thread
      const chatThread = await this.chatThreadRepository.addCustomer(
        threadId,
        this.newCustomerQuote!.customerId
      );

      // Actualizar cotización con chat thread
      const [err, updateQuoteDto] = UpdateQuoteDto.execute({
        chatThreadId: chatThread.id,
      });

      if (!err) {
        await this.quoteRepository.updateQuote(
          this.newCustomerQuote!.id,
          updateQuoteDto
        );
      }

      // Enviar confirmación al cliente
      const confirmationMessage = ` 
      Tu solicitud quedó registrada con el número de cotización 
      COT-${this.newCustomerQuote?.quoteNumber}. 
      Muy pronto el área de Ventas te enviará los precios y tiempos de entrega. 
      Gracias por confiar en nosotros, será un gusto seguir apoyándote`;

      await this.messageService.createWhatsAppMessage({
        to: phoneWa,
        body: confirmationMessage,
      });

      await this.messageRepository.createAssistantMessage({
        content: confirmationMessage,
        chatThreadId,
        to: phoneWa,
      })


      const summarizeConversation = new SummarizeConversationUseCase(
        this.quoteRepository,
        new OpenAiFunctinsService()
      );
      const { summary } = await summarizeConversation.execute(
        this.newCustomerQuote.id
      );

      // Notificaciones
      await this.notifyAboutQuote(
        this.newCustomerQuote,
        summary
      );

      return {
        tool_call_id: action.id,
        output: JSON.stringify({
          succes: true,
          msg: 'Creado correctamente',
          quoteNumber: this.newCustomerQuote?.quoteNumber,
        }),
      };
    } catch (error) {
      console.error('[ExtractCustomerHandler] Error:', error);
      return {
        tool_call_id: action.id,
        output: JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        }),
      };
    }
  }

  private async notifyAboutQuote(quote: any, summary: string): Promise<void> {
    try {
      await new DispatchQuoteNotificationsUseCase(
        this.userRepository,
        this.messageService
      ).execute({
        event: QuoteNotificationEvent.QUOTE_CREATED,
        quote,
        summary
      })

    } catch (error) {
      console.error('[ExtractCustomerHandler] Error en notificaciones:', error);
    }
  }

  getCreatedQuote() {
    return this.newCustomerQuote;
  }
}
