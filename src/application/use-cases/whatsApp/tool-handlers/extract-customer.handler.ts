import { ToolCallHandler, ToolCallOutput, ToolCallContext } from './tool-call-handler.interface';
import { ExtractedData } from '../../../../domain/interfaces/customer';
import { SaveCustomerQuoteUseCase } from '../../save-customer-quote.use-case';
import { SummarizeConversationUseCase } from '../../messages/summarize-conversation.use-case';
import { GetAssignedManagerUseCase } from '../../branch/get-assigned-manager.use-case';
import { ContactService } from '../../../../infrastructure/services/contacts.service';
import { QuoteRepository } from '../../../../domain/repositories/quote.repository';
import { CustomerRepository } from '../../../../domain/repositories/customer.repository';
import { ChatThreadRepository } from '../../../../domain/repositories/chat-thread.repository';
import { BranchRepository } from '../../../../domain/repositories/branch.repository';
import { MessageService } from '../../../../domain/services/message.service';
import { UpdateQuoteDto } from '../../../../domain/dtos/quotes/update-quote.dto';
import { OpenAiFunctinsService } from '../../../../infrastructure/services/openai-functions.service';
import { EmailService } from '../../../../infrastructure/services/mail.service';
import { WhatsAppNotificationService } from '../../../../infrastructure/services/whatsapp-notification.service';
import { envs } from '../../../../config/envs';
import { MessageRepository } from '../../../../domain/repositories/message-repository';



export class ExtractCustomerHandler implements ToolCallHandler {
  private newCustomerQuote: any = null;

  constructor(
    private quoteRepository: QuoteRepository,
    private customerRepository: CustomerRepository,
    private chatThreadRepository: ChatThreadRepository,
    private branchRepository: BranchRepository,
    private messageService: MessageService,
    private messageRepository: MessageRepository
  ) { }

  canHandle(functionName: string): boolean {
    return functionName === 'extract_customer_info';
  }

  async execute(context: ToolCallContext): Promise<ToolCallOutput> {
    const { phoneWa, threadId, chatThreadId, action } = context;

    try {
      // Enviar mensaje de proceso

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

      // await prisma.message.create({
      //   data: {
      //     role: 'assistant',
      //     content: 'Perfecto, dame un momento en lo que genero tu solicitud...',
      //     chatThreadId,
      //     channel: 'WHATSAPP',
      //     direction: 'OUTBOUND',
      //     to: phoneWa,
      //   },
      // });

      // Parsear datos del cliente
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

      // await prisma.message.create({
      //   data: {
      //     role: 'assistant',
      //     content: confirmationMessage,
      //     chatThreadId,
      //     channel: 'WHATSAPP',
      //     direction: 'OUTBOUND',
      //     to: phoneWa,
      //   },
      // });

      // Resumen de la cotización
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
        summary,
        phoneWa
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

  private async notifyAboutQuote(quote: any, summary: string, phoneWa: string): Promise<void> {
    try {
      const contactService = new ContactService(
        new EmailService(),
        new WhatsAppNotificationService(this.messageService)
      );

      const quoteUrl = `${envs.API_URL}/quotes/${quote.id}`;

      // Si hay manager asignado a la sucursal
      if (quote.branchId) {
        try {
          const getAssignedManagerUseCase = new GetAssignedManagerUseCase(
            this.branchRepository
          );
          const manager = await getAssignedManagerUseCase.execute(quote.branchId);

          await contactService.sendWhatsAppTemplate(
            manager.name,
            manager.phone,
            {
              summary,
              url: quoteUrl
            }
          );

          await contactService.sendEmailHtmTemplate(
            manager.name,
            manager.email,
            {
              summary,
              url: quoteUrl
            }
          );
        } catch (managerError) {
          console.warn('[ExtractCustomerHandler] No hay manager, enviando a contactos generales', managerError);

        }
      }

      if (process.env.NODE_ENV === 'production') {

        await contactService.sendWhatsApp({ summary, url: quoteUrl });
      }

    } catch (error) {
      console.error('[ExtractCustomerHandler] Error en notificaciones:', error);
    }
  }

  getCreatedQuote() {
    return this.newCustomerQuote;
  }
}
