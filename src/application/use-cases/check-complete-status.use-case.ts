import OpenAI from "openai"
import { ExtractedData, UpdatedCustomerData } from "../../domain/interfaces/customer"
import { QuoteRepository } from "../../domain/repositories/quote.repository"
import { CustomerRepository } from "../../domain/repositories/customer.repository"
import { SaveCustomerQuoteUseCase } from "./save-customer-quote.use-case"
import { UpdateCustomerUseCase } from "./update-customer.use-case"
import { SendMailUseCase } from "./send-mail.use-case"
import { EmailService } from '../../infrastructure/services/mail.service';

interface Options {
  threadId: string
  runId: string

}


export class CheckCompleteStatusUseCase {


  constructor(
    private readonly openai: OpenAI,
    private readonly quoteRepository: QuoteRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly emailService: EmailService
  ) { }

  async execute(options: Options) {


    const { threadId, runId } = options

    const saveCustomerQuote = new SaveCustomerQuoteUseCase(this.quoteRepository, this.customerRepository)

    const runStatus = await this.openai.beta.threads.runs.retrieve(
      threadId,
      runId
    )

    const status = runStatus.status

    console.log({ status })

    const requiredAction = runStatus.required_action?.submit_tool_outputs.tool_calls


    if (status === 'requires_action') {

      const tool_outputs = await Promise.all(

        requiredAction!.map(async (action) => {

          const functionName = action.function.name

          console.log({ functionName })

          if (functionName === 'extract_customer_info') {

            const clientInfo = JSON.parse(action.function.arguments) as ExtractedData

            console.log({ clientInfo })

            console.log(clientInfo.items[0])
            const {

              customer_name,
              customer_lastname,
              email,
              phone,
              location,
              items,
            } = clientInfo

            const newCustomer = await saveCustomerQuote.execute({
              name: customer_name,
              lastname: customer_lastname,
              email,
              phone,
              location,
              items
            })

            if (newCustomer?.quoteNumber) {

              const getNewCustomerQuote = await this.quoteRepository.findByQuoteNumber({ quoteNumber: newCustomer.quoteNumber })

              if (getNewCustomerQuote) {
                const htmlBody = this.emailService.generarBodyCorreo(getNewCustomerQuote)
                new SendMailUseCase(this.emailService).execute({
                  
                  to: ["eeramirez@tuvansa.com.mx", "gbarranco@tuvansa.com.mx","lquintero@tuvansa.com.mx"],
                  subject: "Hay una nueva cotizacion de WhatsApp Tuvansa  ",
                  htmlBody
                })


              }


            }





            return {
              tool_call_id: action.id,
              output: `{success: true, msg:'Creado correctamente', quoteNumber:'${newCustomer?.quoteNumber}' }`
            }

          }


          if (functionName === 'update_customer_info') {

            const clientInfo = JSON.parse(action.function.arguments) as UpdatedCustomerData

            const {
              customer_name,
              customer_lastname,
              email,
              phone,
              location
            } = clientInfo

            await new UpdateCustomerUseCase(this.customerRepository).execute({
              name: customer_name,
              lastname: customer_lastname,
              email,
              location,
              phone,
              id: ""
            })

            return {
              tool_call_id: action.id,
              output: "{success: true, msg:'Actualizado correctamente'}"
            }

          }





          return {
            tool_call_id: action.id,
            output: "{success: true}"
          }


        }) ?? []

      )



      await this.openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs })


      console.log(tool_outputs[0].output)



    }


    if (status === 'completed') {
      return runStatus
    }


    await new Promise(resolve => setTimeout(resolve, 1000))

    await this.execute(options)

  }
}

// export const checkCompleteStatusUseCase = async (openai: OpenAI, options: Options) => {
//   const { threadId, runId } = options

//   const runStatus = await openai.beta.threads.runs.retrieve(
//     threadId,
//     runId
//   )

//   const status = runStatus.status

//   console.log({ status })

//   const requiredAction = runStatus.required_action?.submit_tool_outputs.tool_calls

//   let tool_outputs = []




//   if (status === 'requires_action') {

//     tool_outputs = requiredAction!.map(action => {

//       const functionName = action.function.name

//       console.log({ functionName })

//       if (functionName === 'extract_customer_info') {

//         const clientInfo = JSON.parse(action.function.arguments) as ExtractedData


//         console.log({ clientInfo })

//       }



//       return {
//         tool_call_id: action.id,
//         output: "{success: true}"
//       }


//     }) ?? []


//     openai.beta.threads.runs.submitToolOutputs(threadId, runId, { tool_outputs })

//   }


//   if (status === 'completed') {
//     return runStatus
//   }


//   await new Promise(resolve => setTimeout(resolve, 1000))

//   await checkCompleteStatusUseCase(openai, options)
// }

const quote = {

  created: 'automatyic date when is procesed, put current date',
  client: {
    name: 'name of client',
    surname: 'last name of client',
    email: ' email of client',

  },
  items: [

    {
      description: 'description of item or product', quantity: 'quantity of item or product'
    }

  ],

  itemsMatch: [
    {
      description: 'vas a tomar la descripcion de la informacion que tienes del catalogo', code: 'vas a poner el codigo que esta en la informacion que tienes de los productos', ean: 'ean'
    }
  ]
}