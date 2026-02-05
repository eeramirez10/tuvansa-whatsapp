import { ExtractedData, UpdatedCustomerData, Customer } from '../../../domain/interfaces/customer';
import { ChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";
import { CustomerRepository } from "../../../domain/repositories/customer.repository";
import { QuoteRepository } from "../../../domain/repositories/quote.repository";
import { SaveThreadUseCase } from './save-tread.use-case';
import { EmailService } from '../../../infrastructure/services/mail.service';
import { SaveHistoryChatUseCase } from "../save-history-chat.use-case";
import { LanguageModelService } from "../../../domain/services/language-model.service";
import { QuoteEntity } from "../../../domain/entities/quote.entity";
import { FileStorageService } from '../../../domain/services/file-storage.service';
import { MessageService } from "../../../domain/services/message.service";
import { UpdateQuoteDto } from "../../../domain/dtos/quotes/update-quote.dto";
import { PrismaClient } from "@prisma/client";
import { SaveCustomerQuoteUseCase } from '../save-customer-quote.use-case';


interface Contacts {
  name: string
  phone: string
  email: string
}


const contacts: Contacts[] = [

  {
    phone: '5215579044897',
    name: 'German Barranco',
    email: "gbarranco@tuvansa.com.mx"
  },
  {
    phone: '5215541142762',
    name: 'Erick',
    email: "eeramirez@tuvansa.com.mx"
  },
  {
    phone: '5216243828879',
    name: 'Luis Quintero',
    email: "lquintero@tuvansa.com.mx"
  },
  {
    phone: '525541141306',
    name: 'Roy Grinberg',
    email: "rgrinberg@tuvansa.com.mx"
  },
  {
    phone: '525522406714',
    name: 'Marcos Avalos',
    email: "mavalos@tuvansa.com.mx"
  },

]


interface Options {

  phoneWa: string,
  question: string
  fileUrl?: string
}

const prisma = new PrismaClient()


export type FunctionNameType = "extract_customer_info" | "update_customer_info";

export class UserCuestionUseCase {

  constructor(
    private openaiService: LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly quoteRepository: QuoteRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly emailService: EmailService,
    private readonly fileStorageService: FileStorageService,
    private readonly messageService: MessageService

  ) {

  }

  async execute(options: Options) {
    const { phoneWa, question } = options;

    // 1) Creamos o recuperamos el thread
    const threadId = await new SaveThreadUseCase(
      this.openaiService,
      this.chatThreadRepository
    ).execute({ phone: phoneWa });



    // 2) Enviamos el mensaje del usuario
    await this.openaiService.createMessage({ threadId, question });

    // 3) Arrancamos el stream y hacemos flush por salto de línea
    const runStream = await this.openaiService.startRunStream({
      threadId,
      assistantId: 'asst_zH28urJes1YILRhYUZrjjakE'
    });

    const { runId, stream } = runStream;


    let buffer = '';
    for await (const event of stream) {
      // filtramos solo los delta
      if (event.event !== 'thread.message.delta') continue;

      const parts = (event.data as any).delta.content as Array<{
        text: { value: string }
      }>;



      for (const part of parts) {
        buffer += part.text.value;

        // enviamos cada vez que haya un '\n'
        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trim();
          if (line) {
            await this.messageService.createWhatsAppMessage({
              to: phoneWa,
              body: line
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
        body: remainder
      });
    }


    let newCustomerQuote: QuoteEntity | null = null;


    while (true) {

      const runstatus = await this.openaiService.checkStatus(threadId, runId)

      if (runstatus.status === 'completed') break

      if (runstatus.status === 'requires_action') {

        const requiredAction = runstatus.required_action?.submit_tool_outputs.tool_calls;

        if (!requiredAction) break

        const saveCustomerQuote = new SaveCustomerQuoteUseCase(this.quoteRepository, this.customerRepository);

        const tool_outputs = await Promise.all(
          requiredAction.map(async (action) => {

            const functionName: FunctionNameType = action.function.name as FunctionNameType;

            if (functionName === 'extract_customer_info') {
              await this.messageService.createWhatsAppMessage({
                to: phoneWa,
                body: 'Perfecto, dame un momento en lo que genero tu solicitud...'
              });
              const clientInfo = JSON.parse(action.function.arguments) as ExtractedData;

              const {
                customer_name,
                customer_lastname,
                email,
                phone,
                location,
                items = [],
                file_key
              } = clientInfo;

              newCustomerQuote = await saveCustomerQuote
                .execute({
                  name: customer_name,
                  lastname: customer_lastname,
                  email,
                  phone,
                  phoneWa,
                  location,
                  items,
                  fileKey: file_key,
                  
                });

              const chatThread = await this.chatThreadRepository.addCustomer(threadId, newCustomerQuote!.customerId)

              const [err, updateQuoteDto] = UpdateQuoteDto.execute({ chatThreadId: chatThread.id })

              await this.quoteRepository.updateQuote(newCustomerQuote.id, updateQuoteDto)

              return {
                tool_call_id: action.id,
                output: JSON.stringify({
                  succes: true,
                  msg: 'Creado correctamente',
                  quoteNumber: newCustomerQuote?.quoteNumber
                })
              };

            }

            if (functionName === 'update_customer_info') {

              await this.messageService.createWhatsAppMessage({
                to: phoneWa,
                body: 'Vamos a actualizar tus datos'
              });


              const clientInfo = JSON.parse(action.function.arguments) as UpdatedCustomerData;
              const { customer_name, customer_lastname, email, phone, location } = clientInfo;


              try {

                const customer = await prisma.customer.findUnique({
                  where: { phoneWa }
                })

                if (!customer) {

                  const payload = { success: false, msg: 'No se encontro al cliente en la BD' }

                  await this.messageService.createWhatsAppMessage({
                    to: phoneWa,
                    body: 'Lo siento, aun no estas registrado con nosotros'
                  });

                  return {
                    tool_call_id: action.id,
                    output: JSON.stringify(payload)

                  };
                }


                await prisma.customer.update({
                  where: {
                    phoneWa
                  },
                  data: {
                    name: customer_name ?? customer.name,
                    lastname: customer_lastname ?? customer.lastname,
                    email: email ?? customer.email,
                    phone: phone ?? customer.phone,
                    location: location ?? customer.location
                  }
                })
                const payload = { success: true, msg: 'Actualizado correctamente' };


                await this.messageService.createWhatsAppMessage({
                  to: phoneWa,
                  body: 'Listo, tus datos quedaron actualizados '
                });
                return {
                  tool_call_id: action.id,
                  output: JSON.stringify(payload)

                };

              } catch (error) {
                console.log(error)


                await this.messageService.createWhatsAppMessage({
                  to: phoneWa,
                  body: 'Lo siento, hubo un error al actualizar tus datos, lo intentare mas tarde'
                });

                return {
                  tool_call_id: action.id,
                  output:
                    "{success: false, msg:'Error al actualizar al cliente'}"
                };

              }

            }

            return { tool_call_id: action.id, output: "{success: true}" };
          })
        );

        await this.openaiService.submitToolOutputs(runstatus.thread_id, runstatus.id, tool_outputs)


      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const messages = await this.openaiService.getMessageList(threadId)

    const chatThread = await this.chatThreadRepository.getByThreadId(threadId)

    if (chatThread?.id) await new SaveHistoryChatUseCase(this.chatThreadRepository).execute({ messages, threadId: chatThread?.id })

    if (!newCustomerQuote) return



    let fileStream;
    let fileUrl: string;

    if (newCustomerQuote.fileKey) {
      fileStream = await this.fileStorageService.getFileStream(newCustomerQuote.fileKey)
      fileUrl = await this.fileStorageService.generatePresignedUrl(newCustomerQuote.fileKey, 360000)

    }

    // console.log({ fileUrl })

    const customerQuote = await this.quoteRepository.findByQuoteNumber({ quoteNumber: newCustomerQuote!.quoteNumber });

    // const htmlBody = this.emailService.generarBodyCorreo(customerQuote!);

    const asistantResponse = messages!.filter(q => q.role === 'assistant')[0]
    await this.messageService.createWhatsAppMessage({
      body: asistantResponse.content.toString(),
      to: phoneWa
    })

    // const lines = this.formatQuoteMessageToWhatsApp(customerQuote)

    // const parts = this.splitMessage(lines.join('\n'));



    // for (const contact of contacts) {

    //   const { phone, email } = contact

    //   if (!fileUrl) {

    //     this.sendQuoteTemplateWhatsApp({
    //       to: phone,
    //       email: email,
    //       quote: customerQuote
    //     })
    //     continue;
    //   }

    //   this.sendQuoteWithFileToWhatsApp({
    //     to: phone,
    //     mediaUrl: fileUrl,
    //     quote: customerQuote
    //   })

    // }


    // new SendMailUseCase(this.emailService)
    //   .execute({
    //     to: [
    //       ...contacts.map((contact) => contact.email)
    //     ],
    //     subject: "Nueva cotización asistente IA  desde WhatsApp Tuvansa ",
    //     htmlBody: htmlBody,
    //     attachments: fileStream ? [
    //       {
    //         filename: newCustomerQuote.fileKey,
    //         content: fileStream.body
    //       }
    //     ] : null
    //   }).then(() => {
    //     console.log('Correo enviado correctamente')
    //   }).catch((e) => {
    //     console.log('[SendMailUseCase]', e)
    //   })






    return true


  }




  private splitMessage(text: string): string[] {
    const MAX_LEN = 150
    const lines = text.split('\n');
    const chunks: string[] = [];
    let buffer = '';

    for (const line of lines) {
      // si añadir la línea supera el límite, cierra el chunk y comienza otro
      if ((buffer + '\n' + line).length > MAX_LEN) {
        chunks.push(buffer);
        buffer = line;
      } else {
        buffer = buffer ? `${buffer}\n${line}` : line;
      }
    }
    if (buffer) chunks.push(buffer);
    return chunks;
  }

  private async sendQuoteWithFileToWhatsApp(options: { to: string, mediaUrl: string, quote: QuoteEntity }) {

    const { to, mediaUrl, quote, } = options
    const contentSid = 'HX64107be15f35d339875da869552e1ae3';

    const relativeUrl = this.getRelativePresignedPath(mediaUrl)
    const vars = this.formatQuoteForTemplateVars(quote)

    try {
      await this.messageService.createWhatsAppMessage({
        to,
        contentSid,
        contentVariables: JSON.stringify({ ...vars, 6: relativeUrl }),
      })

      console.log(`Cotizacion enviada a ${to}`)

    } catch (error) {
      console.log(error)
      console.log(`Error al enviar cotizacion a ${to}`)
    }

  }

  private async sendQuoteTemplateWhatsApp(options: { to: string, email: string, mediaUrl?: string[], quote: QuoteEntity }) {
    const { to, mediaUrl, quote, email } = options
    const contentSid = 'HX5848387909140c2fd8b1c614c38b7d7e';


    const vars = this.formatQuoteForTemplateVars(quote)


    try {
      await this.messageService.createWhatsAppMessage({
        to,
        contentSid,
        contentVariables: JSON.stringify({ ...vars, 7: email })
      })

      console.log(`Cotizacion enviada a ${to}`)

    } catch (error) {
      console.log(error)
      console.log(`Error al enviar cotizacion a ${to}`)
    }


  }


  private formatQuoteForTemplateVars(quote: QuoteEntity) {

    const { customer, items } = quote;

    const MAX_LENGTH = 1000;
    let productos: string[] = [];
    let currentLength = 0;


    if (items.length === 0) return {
      '1': customer.name,
      '2': customer.lastname,
      '3': customer.email,
      '4': customer.location,
      '5': customer.phone,
    }

    for (const item of items) {
      const line = `Código: ${item.codigo}, Desc: ${item.description}, EAN: ${item.ean}, UM: ${item.um}, Cant: ${item.quantity}`;

      if ((currentLength + line.length + 3) > MAX_LENGTH) { // +3 por separador
        productos.push('...');
        break;
      }

      productos.push(line);
      currentLength += line.length + 3;
    }

    return {
      '1': customer.name,
      '2': customer.lastname,
      '3': customer.email,
      '4': customer.location,
      '5': customer.phone,
      '6': productos.join(' ******************** ').replace(/\s*\n\s*/g, ' ')
    };

  }

  private getRelativePresignedPath(fullUrl: string): string {
    const url = new URL(fullUrl);
    return url.pathname.slice(1) + url.search;
  }
}
