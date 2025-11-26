import { PrismaClient } from "@prisma/client";
import { ChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";
import { CustomerRepository } from "../../../domain/repositories/customer.repository";
import { QuoteRepository } from "../../../domain/repositories/quote.repository";
import { LanguageModelService } from "../../../domain/services/language-model.service";
import { MessageService } from "../../../domain/services/message.service";
import { ExtractedData, UpdatedCustomerData } from "../../../domain/interfaces/customer";
import { UpdateQuoteDto } from "../../../domain/dtos/quotes/update-quote.dto";
import { SaveCustomerQuoteUseCase } from "../save-customer-quote.use-case";
import { QuoteEntity } from "../../../domain/entities/quote.entity";
import { SummarizeConversationUseCase } from "../messages/summarize-conversation.use-case";
import { OpenAiFunctinsService } from "../../../infrastructure/services/openai-functions.service";
import { ContactService } from '../../../infrastructure/services/contacts.service';
import { envs } from "../../../config/envs";
import { EmailService } from "../../../infrastructure/services/mail.service";
import { WhatsAppNotificationService } from "../../../infrastructure/services/whatsapp-notification.service";


interface CoreOptions {
  phoneWa: string;
  question: string;     // puede ser varios mensajes concatenados
  threadId: string;     // openAiThreadId
  chatThreadId: string; // UUID interno del ChatThread
}

const prisma = new PrismaClient

export type FunctionNameType = 'extract_customer_info' | 'update_customer_info';

export class UserQuestionCoreUseCase {

  constructor(
    public readonly openaiService: LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly quoteRepository: QuoteRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly messageService: MessageService,

  ) { }


  async execute(options: CoreOptions) {

    const { phoneWa, question, threadId, chatThreadId } = options

    await prisma.message.create({
      data: {
        role: 'user',
        content: question,
        chatThreadId,
        channel: 'WHATSAPP',
        direction: 'INBOUND',
        from: phoneWa,
      }
    })

    console.log({ question })

    await this.openaiService.createMessage({ threadId, question })

    const runStream = await this.openaiService.startRunStream({ threadId, assistantId: 'asst_zH28urJes1YILRhYUZrjjakE' })

    const { runId, stream } = runStream;

    // STREAMING: respondemos por cada salto de línea para que el cliente vea movimiento
    let buffer = '';
    for await (const event of stream) {
      if (event.event !== 'thread.message.delta') continue;

      const parts = (event.data as any).delta.content as Array<{
        text: { value: string };
      }>;

      for (const part of parts) {
        buffer += part.text.value;

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trim();
          if (line) {
            await this.messageService.createWhatsAppMessage({
              to: phoneWa,
              body: line,
            });

            await prisma.message.create({
              data: {
                role: 'assistant',
                content: line,
                chatThreadId,
                channel: 'WHATSAPP',
                direction: 'OUTBOUND',
                to: phoneWa,
              },
            });
          }
          buffer = buffer.slice(idx + 1);
        }
      }
    }

    const remainder = buffer.trim();
    if (remainder) {
      await this.messageService.createWhatsAppMessage({
        to: phoneWa,
        body: remainder,
      });

      await prisma.message.create({
        data: {
          role: 'assistant',
          content: remainder,
          chatThreadId,
          channel: 'WHATSAPP',
          direction: 'OUTBOUND',
          to: phoneWa,
        },
      });
    }

    let newCustomerQuote: QuoteEntity | null = null;

    while (true) {
      const runstatus = await this.openaiService.checkStatus(threadId, runId);

      if (runstatus.status === 'completed') break;

      if (runstatus.status === 'requires_action') {
        const requiredAction =
          runstatus.required_action?.submit_tool_outputs.tool_calls;

        if (!requiredAction) break;

        const saveCustomerQuote = new SaveCustomerQuoteUseCase(
          this.quoteRepository,
          this.customerRepository,
        );

        const tool_outputs = await Promise.all(
          requiredAction.map(async (action) => {
            const functionName: FunctionNameType =
              action.function.name as FunctionNameType;

            if (functionName === 'extract_customer_info') {
              await this.messageService.createWhatsAppMessage({
                to: phoneWa,
                body: 'Perfecto, dame un momento en lo que genero tu solicitud...',
              });

              const clientInfo = JSON.parse(
                action.function.arguments,
              ) as ExtractedData;

              const {
                customer_name,
                customer_lastname,
                email,
                phone,
                location,
                items = [],
                file_key,
              } = clientInfo;

              newCustomerQuote = await saveCustomerQuote.execute({
                name: customer_name,
                lastname: customer_lastname,
                email,
                phone,
                phoneWa,
                location,
                items,
                fileKey: file_key,
              });

              const chatThread = await this.chatThreadRepository.addCustomer(
                threadId,
                newCustomerQuote!.customerId,
              );

              const [err, updateQuoteDto] = UpdateQuoteDto.execute({
                chatThreadId: chatThread.id,
              });

              if (!err) {
                await this.quoteRepository.updateQuote(
                  newCustomerQuote!.id,
                  updateQuoteDto,
                );
              }

              await this.messageService.createWhatsAppMessage({
                to: phoneWa,
                body: `
                  Tu solicitud quedó registrada con el número de cotización COT-${newCustomerQuote?.quoteNumber}. Muy pronto el área de Ventas te enviará los precios y tiempos de entrega. Gracias por confiar en nosotros, será un gusto seguir apoyándote
                `,
              });


              return {
                tool_call_id: action.id,
                output: JSON.stringify({
                  succes: true,
                  msg: 'Creado correctamente',
                  quoteNumber: newCustomerQuote?.quoteNumber,
                }),
              };
            }

            if (functionName === 'update_customer_info') {
              await this.messageService.createWhatsAppMessage({
                to: phoneWa,
                body: 'Vamos a actualizar tus datos',
              });

              const clientInfo = JSON.parse(
                action.function.arguments,
              ) as UpdatedCustomerData;
              const { customer_name, customer_lastname, email, phone, location } =
                clientInfo;

              try {
                const customer = await prisma.customer.findUnique({
                  where: { phoneWa },
                });

                if (!customer) {
                  const payload = {
                    success: false,
                    msg: 'No se encontro al cliente en la BD',
                  };

                  await this.messageService.createWhatsAppMessage({
                    to: phoneWa,
                    body: 'Lo siento, aun no estas registrado con nosotros',
                  });

                  return {
                    tool_call_id: action.id,
                    output: JSON.stringify(payload),
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
                  },
                });

                const payload = {
                  success: true,
                  msg: 'Actualizado correctamente',
                };

                await this.messageService.createWhatsAppMessage({
                  to: phoneWa,
                  body: 'Listo, tus datos quedaron actualizados ',
                });

                return {
                  tool_call_id: action.id,
                  output: JSON.stringify(payload),
                };
              } catch (error) {
                console.log(error);

                await this.messageService.createWhatsAppMessage({
                  to: phoneWa,
                  body:
                    'Lo siento, hubo un error al actualizar tus datos, lo intentare mas tarde',
                });

                return {
                  tool_call_id: action.id,
                  output:
                    "{success: false, msg:'Error al actualizar al cliente'}",
                };
              }
            }

            return { tool_call_id: action.id, output: '{success: true}' };
          }),
        );

        await this.openaiService.submitToolOutputs(
          runstatus.thread_id,
          runstatus.id,
          tool_outputs,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }



    // 4) Guardar historial (como ya hacías)
    // const messages = await this.openaiService.getMessageList(threadId);

    // await new SaveHistoryChatUseCase(this.chatThreadRepository).execute({
    //   messages,
    //   threadId: chatThreadId,
    // });

    // 5) PDF/correo si se creó una nueva cotización
    if (!newCustomerQuote) return;

    const summarizeConversation = new SummarizeConversationUseCase(this.quoteRepository, new OpenAiFunctinsService)

    const { summary } = await summarizeConversation.execute(newCustomerQuote.id)

    console.log({ summary })

    const contactService = new ContactService(new EmailService(), new WhatsAppNotificationService(this.messageService))

    contactService.sendWhatsApp({
      summary,
      url: `${envs.API_URL}/quotes/${newCustomerQuote.id}`
    })

    contactService.sendEmail({
      summary,
      url: `${envs.API_URL}/quotes/${newCustomerQuote.id}`
    })


    // let fileStream: any;
    // let fileUrl: string | undefined;

    // if (newCustomerQuote.fileKey) {
    //   fileStream = await this.fileStorageService.getFileStream(
    //     newCustomerQuote.fileKey,
    //   );
    //   fileUrl = await this.fileStorageService.generatePresignedUrl(
    //     newCustomerQuote.fileKey,
    //     360000,
    //   );
    // }

    // const customerQuote = await this.quoteRepository.findByQuoteNumber({
    //   quoteNumber: newCustomerQuote.quoteNumber,
    // });

    // const htmlBody = this.emailService.generarBodyCorreo(customerQuote!);

    // Aquí puedes reactivar todo tu envío de correo / plantillas de WhatsApp
    // como ya lo tenías.


  }
}