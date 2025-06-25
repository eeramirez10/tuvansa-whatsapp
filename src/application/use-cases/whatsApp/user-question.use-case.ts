import { ExtractedData, UpdatedCustomerData } from "../../../domain/interfaces/customer";
import { ChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";
import { CustomerRepository } from "../../../domain/repositories/customer.repository";
import { QuoteRepository } from "../../../domain/repositories/quote.repository";
import { SaveCustomerQuoteUseCase } from "../save-customer-quote.use-case";
import { SaveThreadUseCase } from './save-tread.use-case';
import { EmailService } from '../../../infrastructure/services/mail.service';
import { UpdateCustomerUseCase } from "../update-customer.use-case";
import { SaveHistoryChatUseCase } from "../save-history-chat.use-case";
import { LanguageModelService } from "../../../domain/services/language-model.service";
import { QuoteEntity } from "../../../domain/entities/quote.entity";
import { FileStorageService } from '../../../domain/services/file-storage.service';
import { MessageService } from "../../../domain/services/message.service";
import { SendMailUseCase } from "../send-mail.use-case";


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
  // {
  //   phone: '5216243828879',
  //   name: 'Luis Quintero',
  //   email: "lquintero@tuvansa.com.mx"
  // },
  // {
  //   phone: '525541141306',
  //   name: 'Roy Grinberg',
  //   email: "rgrinberg@tuvansa.com.mx"
  // },
  // {
  //   phone: '525522406714',
  //   name: 'Marcos Avalos',
  //   email: "mavalos@tuvansa.com.mx"
  // },

]


interface Options {

  phone: string,
  question: string
  fileUrl?: string
}


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
    const { phone, question } = options;

    // 1) Creamos o recuperamos el thread
    const threadId = await new SaveThreadUseCase(
      this.openaiService,
      this.chatThreadRepository
    ).execute({ phone });

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
              to: phone,
              body: line
            });
          }
          buffer = buffer.slice(idx + 1);
        }
      }
    }

    // 4) Enviamos el resto del buffer
    const remainder = buffer.trim();
    if (remainder) {
      await this.messageService.createWhatsAppMessage({
        to: phone,
        body: remainder
      });
    }

    // 5) Polling para tool-calls y guardado (igual que antes)

    let newCustomerQuote: QuoteEntity | null = null;


    while (true) {

      const runstatus = await this.openaiService.checkStatus(threadId, runId)

      if (runstatus.status === 'completed') break

      if (runstatus.status === 'requires_action') {

        await this.messageService.createWhatsAppMessage({
          to: phone,
          body: 'Perfecto, dame un momento en lo que genero tu solicitud...'
        });

        const requiredAction = runstatus.required_action?.submit_tool_outputs.tool_calls;

        console.log({ requiredAction })

        if (!requiredAction) break

        const saveCustomerQuote = new SaveCustomerQuoteUseCase(this.quoteRepository, this.customerRepository);

        console.log({ requiredAction })

        const tool_outputs = await Promise.all(
          requiredAction.map(async (action) => {
            const functionName = action.function.name;
            console.log({ functionName });

            if (functionName === 'extract_customer_info') {
              const clientInfo = JSON.parse(action.function.arguments) as ExtractedData;
              console.log({ clientInfo });

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
                  location,
                  items,
                  fileKey: file_key
                });

              console.log({ newCustomerQuote })
              console.log({ threadId })

              await this.chatThreadRepository.addCustomer(threadId, newCustomerQuote!.customerId)

              return {
                tool_call_id: action.id,
                output: `{success: true, msg:'Creado correctamente', quoteNumber:'${newCustomerQuote?.quoteNumber}' }`
              };
            }

            if (functionName === 'update_customer_info') {
              const clientInfo = JSON.parse(action.function.arguments) as UpdatedCustomerData;
              const { customer_name, customer_lastname, email, phone, location } = clientInfo;

              await new UpdateCustomerUseCase(this.customerRepository).execute({
                name: customer_name,
                lastname: customer_lastname,
                email,
                phone,
                location,
                id: ""
              })

              return {
                tool_call_id: action.id,
                output:
                  "{success: true, msg:'Actualizado correctamente'}"
              };
            }

            return { tool_call_id: action.id, output: "{success: true}" };
          })
        );

        await this.openaiService.submitToolOutputs(runstatus.thread_id, runstatus.id, tool_outputs)


        console.log(tool_outputs[0]?.output);


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

    console.log({ fileUrl })

    const customerQuote = await this.quoteRepository.findByQuoteNumber({ quoteNumber: newCustomerQuote!.quoteNumber });

    const htmlBody = this.emailService.generarBodyCorreo(customerQuote!);

    const asistantResponse = messages!.filter(q => q.role === 'assistant')[0]
    await this.messageService.createWhatsAppMessage({
      body: asistantResponse.content.toString(),
      to: phone
    })

    // const lines = this.formatQuoteMessageToWhatsApp(customerQuote)

    // const parts = this.splitMessage(lines.join('\n'));



    for (const contact of contacts) {

      const { phone, email } = contact

      if (!fileUrl) {

        this.sendQuoteTemplateWhatsApp({
          to: phone,
          email: email,
          quote: customerQuote
        })
        continue;
      }

      this.sendQuoteWithFileToWhatsApp({
        to: phone,
        mediaUrl: fileUrl,
        quote: customerQuote
      })

    }


    new SendMailUseCase(this.emailService)
      .execute({
        to: [
          ...contacts.map((contact) => contact.email)
        ],
        subject: "Nueva cotización asistente IA  desde WhatsApp Tuvansa ",
        htmlBody: htmlBody,
        attachments: fileStream ? [
          {
            filename: newCustomerQuote.fileKey,
            content: fileStream.body
          }
        ] : null
      }).then(() => {
        console.log('Correo enviado correctamente')
      }).catch((e) => {
        console.log('[SendMailUseCase]', e)
      })






    return true


  }


  private formatQuoteMessageToWhatsApp(customerQuote: QuoteEntity) {

    const { customer, items } = customerQuote;

    const lines: string[] = [
      '*🆕 Nueva cotización TUVANSA IA*',
      '',
      `• Nombre: _${customer.name} ${customer.lastname}_`,
      `• Email: _${customer.email}_`,
      `• Ubicación: _${customer.location}_`,
      `• Teléfono: _${customer.phone}_`,
      '',
      '*🛒 Cotización:*'
    ];

    if (items.length > 0) {

      // 2) Para cada ítem, añadimos su sección
      items.forEach(item => {
        lines.push('');
        lines.push(`• Código: *${item.codigo}*`);
        lines.push(`  - Descripción: ${item.description}`);
        lines.push(`  - EAN: ${item.ean}`);
        lines.push(`  - Unidad: ${item.um}`);
        lines.push(`  - Cantidad: ${item.quantity}`);
      });

    }



    return lines;

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
      '6': productos.join(' ******************** ') // todo en 1 línea, sin \n
    };

  }

  private getRelativePresignedPath(fullUrl: string): string {
    const url = new URL(fullUrl);
    return url.pathname.slice(1) + url.search;
  }
}