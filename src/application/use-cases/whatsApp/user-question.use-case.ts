import { ExtractedData, UpdatedCustomerData } from "../../../domain/interfaces/customer";
import { ChatThreadRepository } from "../../../domain/repositories/chat-thread.repository";
import { CustomerRepository } from "../../../domain/repositories/customer.repository";
import { QuoteRepository } from "../../../domain/repositories/quote.repository";
import { SaveCustomerQuoteUseCase } from "../save-customer-quote.use-case";
import { SendMailUseCase } from "../send-mail.use-case";
import { SaveThreadUseCase } from './save-tread.use-case';
import { EmailService } from '../../../infrastructure/services/mail.service';
import { UpdateCustomerUseCase } from "../update-customer.use-case";
import { SaveHistoryChatUseCase } from "../save-history-chat.use-case";
import { LanguageModelService } from "../../../domain/services/language-model.service";
import { QuoteEntity } from "../../../domain/entities/quote.entity";
import { FileStorageService } from '../../../domain/services/file-storage.service';



interface Options {

  phone: string,
  question: string
}


export class UserCuestionUseCase {

  constructor(
    private openaiService: LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly quoteRepository: QuoteRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly emailService: EmailService,
    private readonly fileStorageService: FileStorageService

  ) {

  }

  async execute(options: Options) {
    const { phone, question } = options



    const threadId = await new SaveThreadUseCase(this.openaiService, this.chatThreadRepository).execute({ phone })

    const message = await this.openaiService.createMessage({ threadId, question })


    const run = await this.openaiService.createRun({ threadId })

    let newCustomerQuote: QuoteEntity | null;




    while (true) {

      const runstatus = await this.openaiService.checkStatus(threadId, run.id)

      if (runstatus.status === 'completed') break

      if (runstatus.status === 'requires_action') {

        const requiredAction = runstatus.required_action?.submit_tool_outputs.tool_calls;

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

    if (newCustomerQuote) {
      let fileStream;
      
      if (newCustomerQuote.fileKey) fileStream = await this.fileStorageService.getFileStream(newCustomerQuote.fileKey)

      const customerQuote = await this.quoteRepository.findByQuoteNumber({ quoteNumber: newCustomerQuote!.quoteNumber });

      const htmlBody = this.emailService.generarBodyCorreo(customerQuote!);

     


      new SendMailUseCase(this.emailService)
        .execute({
          to: [
            "eeramirez@tuvansa.com.mx",
            "gbarranco@tuvansa.com.mx",
            "mavalos@tuvansa.com.mx",
            "rgrinberg@tuvansa.com.mx"
          ],
          subject: "Nueva cotización asistente IA  desde WhatsApp Tuvansa ",
          htmlBody: fileStream ? null : htmlBody,
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

    }




    return messages


  }
}