import { PrismaClient } from "@prisma/client";
import { ChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";
import { CustomerRepository } from "../../../domain/repositories/customer.repository";
import { QuoteRepository } from "../../../domain/repositories/quote.repository";
import { LanguageModelService } from "../../../domain/services/language-model.service";
import { MessageService } from "../../../domain/services/message.service";
import { ExtractedData, UpdatedCustomerData } from "../../../domain/interfaces/customer";
import { UpdateQuoteDto } from "../../../domain/dtos/quotes/update-quote.dto";

import { QuoteEntity } from "../../../domain/entities/quote.entity";
import { SummarizeConversationUseCase } from "../messages/summarize-conversation.use-case";
import { OpenAiFunctinsService } from "../../../infrastructure/services/openai-functions.service";
import { ContactService } from '../../../infrastructure/services/contacts.service';
import { envs } from "../../../config/envs";
import { EmailService } from "../../../infrastructure/services/mail.service";
import { WhatsAppNotificationService } from "../../../infrastructure/services/whatsapp-notification.service";
import { ProductStreamParser } from "../../../infrastructure/services/product-stream-parser.service";
import { SaveCustomerQuoteUseCase } from "../save-customer-quote.use-case";
import { ProcessFileForQuoteUseCase } from "../file/process-file-for-quote.use-case";
import { FileStorageService } from '../../../domain/services/file-storage.service';
import { FileRepository } from "../../../domain/repositories/file.repository";
import { FileDatasource } from '../../../domain/datasource/file.datasource';


interface CoreOptions {
  phoneWa: string;
  question: string;     // puede ser varios mensajes concatenados
  threadId: string;     // openAiThreadId
  chatThreadId: string; // UUID interno del ChatThread

}

const prisma = new PrismaClient

export type FunctionNameType = 'extract_customer_info' | 'update_customer_info' | 'get_info_customer' | 'get_branches' | 'process_file_for_quote';

export class UserQuestionCoreUseCase {

  constructor(
    public readonly openaiService: LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly quoteRepository: QuoteRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly messageService: MessageService,
    private readonly fileRepository: FileRepository,
    private readonly fileStorageService: FileStorageService

  ) { }


  async execute(options: CoreOptions) {

    const contactService = new ContactService(new EmailService(), new WhatsAppNotificationService(this.messageService))
    const summarizeConversation = new SummarizeConversationUseCase(this.quoteRepository, new OpenAiFunctinsService)
    const parser = new ProductStreamParser();

    let newCustomerQuote: QuoteEntity | null = null;
    let usedGetInfoCustomer = false

    const { phoneWa, question, threadId, chatThreadId } = options




    try {

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



      await this.openaiService.createMessage({ threadId, question })

      const runStream = await this.openaiService.startRunStream({ threadId, assistantId: 'asst_zH28urJes1YILRhYUZrjjakE' })

      const { runId, stream } = runStream;

      // STREAMING: respondemos por cada salto de línea para que el cliente vea movimiento
      let buffer = '';
      let nonProductBuffer = '';
      let nonProductUseNewlines = false;
      let lastLineWasBullet = false;

      for await (const event of stream) {
        if (event.event !== 'thread.message.delta') continue;

        const parts = (event.data as any).delta.content as Array<{ text: { value: string } }>;

        for (const part of parts) {
          buffer += part.text.value;

          let idx: number;
          while ((idx = buffer.indexOf('\n')) !== -1) {
            const rawLine = buffer.slice(0, idx);
            const line = rawLine.trim();

            // Detectar líneas vacías ANTES de filtrarlas
            if (rawLine.trim() === '') {
              nonProductUseNewlines = true;
              lastLineWasBullet = false;
            }

            if (line) {
              const { isProductLine, completedIndex } = parser.processLine(line);

              // Si NO es línea de producto → la mandas tal cual
              if (!isProductLine) {
                const isBullet = /^([•*-]|\d+[).])/.test(line);

                if (isBullet) {
                  nonProductUseNewlines = true;
                  // Si la línea anterior también era bullet, agregar línea en blanco
                  if (lastLineWasBullet) {
                    nonProductBuffer += '\n';
                  }
                  lastLineWasBullet = true;
                } else {
                  lastLineWasBullet = false;
                }

                const separator = nonProductBuffer
                  ? (nonProductUseNewlines ? '\n' : ' ')
                  : '';
                nonProductBuffer = `${nonProductBuffer}${separator}${line}`;
              }


              if (completedIndex != null) {
                if (nonProductBuffer) {
                  await this.messageService.createWhatsAppMessage({
                    to: phoneWa,
                    body: nonProductBuffer,
                  });
                  await prisma.message.create({
                    data: {
                      role: 'assistant',
                      content: nonProductBuffer,
                      chatThreadId,
                      channel: 'WHATSAPP',
                      direction: 'OUTBOUND',
                      to: phoneWa,
                    },
                  });
                  nonProductBuffer = '';
                  nonProductUseNewlines = false;
                }
                const bloque = parser.formatProduct(completedIndex);
                if (bloque) {
                  await this.messageService.createWhatsAppMessage({ to: phoneWa, body: bloque });
                  await prisma.message.create({
                    data: {
                      role: 'assistant',
                      content: bloque,
                      chatThreadId,
                      channel: 'WHATSAPP',
                      direction: 'OUTBOUND',
                      to: phoneWa,
                    },
                  });
                  parser.markSent(completedIndex);
                }
              }
            }

            buffer = buffer.slice(idx + 1);
          }
        }
      }

      const remainder = buffer.trim();
      console.log({ remainder })
      if (remainder) {
        const trimmedRemainder = remainder.trim();
        const shouldPreserveLineBreaks =
          trimmedRemainder === '' ||
          /^([•*-]|\d+[).])/.test(trimmedRemainder);
        if (shouldPreserveLineBreaks) {
          nonProductUseNewlines = true;
        }
        const separator = nonProductBuffer
          ? (nonProductUseNewlines ? '\n' : ' ')
          : '';
        nonProductBuffer = `${nonProductBuffer}${separator}${remainder}`;
      }

      if (nonProductBuffer) {
        await this.messageService.createWhatsAppMessage({
          to: phoneWa,
          body: nonProductBuffer,
        });

        await prisma.message.create({
          data: {
            role: 'assistant',
            content: nonProductBuffer,
            chatThreadId,
            channel: 'WHATSAPP',
            direction: 'OUTBOUND',
            to: phoneWa,
          },
        });
        nonProductUseNewlines = false;
      }




      while (true) {


        const runstatus = await this.openaiService.checkStatus(threadId, runId);

        console.log(runstatus.last_error)



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

              console.log({ functionName })

              if (functionName === 'get_info_customer') {
                usedGetInfoCustomer = true

                const customer = await prisma.customer.findUnique({
                  where: {
                    phoneWa
                  }
                })

                console.log({ customer })

                if (!customer) {
                  const payload = {
                    exists: false,
                    customer: null
                  }

                  return {
                    tool_call_id: action.id,
                    output: JSON.stringify(payload)
                  }
                }

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
                }

                console.log({ payload })


                return {
                  tool_call_id: action.id,
                  output: JSON.stringify(payload)
                }

              }

              if (functionName === 'extract_customer_info') {


                await this.messageService.createWhatsAppMessage({
                  to: phoneWa,
                  body: 'Perfecto, dame un momento en lo que genero tu solicitud...',
                });


                await prisma.message.create({
                  data: {
                    role: 'assistant',
                    content: 'Perfecto, dame un momento en lo que genero tu solicitud...',
                    chatThreadId,
                    channel: 'WHATSAPP',
                    direction: 'OUTBOUND',
                    to: phoneWa,
                  },
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
                  company,
                  branch_id
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
                  company,
                  branchId: branch_id
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

                await prisma.message.create({
                  data: {
                    role: 'assistant',
                    content: `
                  Tu solicitud quedó registrada con el número de cotización COT-${newCustomerQuote?.quoteNumber}. Muy pronto el área de Ventas te enviará los precios y tiempos de entrega. Gracias por confiar en nosotros, será un gusto seguir apoyándote
                `,
                    chatThreadId,
                    channel: 'WHATSAPP',
                    direction: 'OUTBOUND',
                    to: phoneWa,
                  },
                });



                const { summary } = await summarizeConversation.execute(newCustomerQuote.id)

                if (phoneWa === "5215541142762") {
                  return {
                    tool_call_id: action.id,
                    output: JSON.stringify({
                      succes: true,
                      msg: 'Creado correctamente',
                      quoteNumber: newCustomerQuote?.quoteNumber,
                    }),
                  }
                }

                contactService.sendWhatsApp({
                  summary,
                  url: `${envs.API_URL}/quotes/${newCustomerQuote.id}`
                })

                contactService.sendEmail({
                  summary,
                  url: `${envs.API_URL}/quotes/${newCustomerQuote.id}`
                })


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

                usedGetInfoCustomer = true
                await this.messageService.createWhatsAppMessage({
                  to: phoneWa,
                  body: 'Vamos a actualizar tus datos',
                });

                const clientInfo = JSON.parse(
                  action.function.arguments,
                ) as UpdatedCustomerData;
                const { customer_name, customer_lastname, email, phone, location, company } =
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
                      company: company ?? customer.company
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



              if (functionName === 'get_branches') {

                usedGetInfoCustomer = true

                const branches = await prisma.branch.findMany({
                  select: {
                    id: true,
                    name: true,
                    address: true
                  }
                })

                return {
                  tool_call_id: action.id,
                  output: JSON.stringify(branches)
                }
              }

              if (functionName === 'process_file_for_quote') {
                usedGetInfoCustomer = true

                const { file_key } = JSON.parse(action.function.arguments);

                await new ProcessFileForQuoteUseCase(this.fileStorageService, this.fileRepository)
                  .execute({ fileKey: file_key, chatThreadId });

                return {
                  tool_call_id: action.id,
                  output: JSON.stringify({
                    success: true,
                    message: `Archivo ${file_key} procesado correctamente`
                  })
                };

                // Agregar resultado al thread
                // await this.openaiService.submitToolResult(threadId, toolResult);
              }

              return { tool_call_id: action.id, output: '{success: true}' };
            }),
          );

          console.log({ tool_outputs })

          await this.openaiService.submitToolOutputs(
            runstatus.thread_id,
            runstatus.id,
            tool_outputs,
          );


        }



        await new Promise((resolve) => setTimeout(resolve, 3500));
      }

      // Obtener y enviar respuesta final del asistente si usó get_info_customer
      const text = await this.getLastConversationAsistant(threadId)

      console.log({ text })

      if (text && usedGetInfoCustomer) {
        await this.messageService.createWhatsAppMessage({
          to: phoneWa,
          body: text,
        });

        await prisma.message.create({
          data: {
            role: 'assistant',
            content: text,
            chatThreadId,
            channel: 'WHATSAPP',
            direction: 'OUTBOUND',
            to: phoneWa,
          },
        });
      }


    } catch (error) {

      console.log(error)

      throw new Error('[UserQuestionCore]error')

    }

  }

  private async getLastConversationAsistant(threadId: string) {

    const messages = await this.openaiService.getMessageList(threadId);

    // Ajusta esto según el shape que te regrese getMessageList

    const ordered = [...messages].sort((a, b) => a.created_at - b.created_at)
    const lastAssistant = ordered.filter((data) => data.role === 'assistant').at(-1)



    return lastAssistant.content[0]

  }
}