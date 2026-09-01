import { QuoteNotificationEvent } from '../../../../domain/enums/notification.enum'
import { QuoteProductDraft } from '../../../../domain/interfaces/quote-product-draft'
import { BranchRepository } from '../../../../domain/repositories/branch.repository'
import { ChatThreadRepository } from '../../../../domain/repositories/chat-thread.repository'
import { CustomerRepository } from '../../../../domain/repositories/customer.repository'
import { FileRepository } from '../../../../domain/repositories/file.repository'
import { MessageRepository } from '../../../../domain/repositories/message-repository'
import { QuoteRepository } from '../../../../domain/repositories/quote.repository'
import { UserRepository } from '../../../../domain/repositories/user-repository'
import { FileStorageService } from '../../../../domain/services/file-storage.service'
import { MessageService } from '../../../../domain/services/message.service'
import { QuoteProductValidator } from '../../../../domain/services/quote-product-validator'
import { UpdateQuoteDto } from '../../../../domain/dtos/quotes/update-quote.dto'
import { OpenAiFunctinsService } from '../../../../infrastructure/services/openai-functions.service'
import { SaveCustomerQuoteUseCase } from '../../save-customer-quote.use-case'
import { SummarizeConversationUseCase } from '../../messages/summarize-conversation.use-case'
import { DispatchQuoteNotificationsUseCase } from '../dispatch-quote-notifications.use-case'
import { ToolCallContext, ToolCallHandler, ToolCallOutput } from './tool-call-handler.interface'

interface CreateQuoteRequestArguments {
  mode: 'TEXT' | 'FILE'
  confirmation_obtained: boolean
  customer_name?: string
  customer_lastname?: string
  email?: string
  phone?: string
  location?: string
  company?: string
  branch_id?: string
  file_key?: string
  items?: QuoteProductDraft[]
}

export class CreateQuoteRequestHandler implements ToolCallHandler {
  constructor(
    private readonly quoteRepository: QuoteRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly branchRepository: BranchRepository,
    private readonly fileRepository: FileRepository,
    private readonly fileStorageService: FileStorageService,
    private readonly messageService: MessageService,
    private readonly messageRepository: MessageRepository,
    private readonly userRepository: UserRepository,
    private readonly validator: QuoteProductValidator
  ) { }

  canHandle(functionName: string): boolean {
    return functionName === 'create_quote_request'
  }

  async execute(context: ToolCallContext): Promise<ToolCallOutput> {
    try {
      const args = JSON.parse(context.action.function.arguments) as CreateQuoteRequestArguments

      if (args.confirmation_obtained !== true) {
        return this.failure(context, 'CONFIRMATION_REQUIRED', 'Falta la confirmacion explicita del cliente')
      }

      if (!args.branch_id?.trim()) {
        return this.failure(context, 'BRANCH_REQUIRED', 'Falta seleccionar una sucursal')
      }

      try {
        const branch = await this.branchRepository.getBranch(args.branch_id)
        if (!branch) {
          return this.failure(context, 'INVALID_BRANCH', 'La sucursal seleccionada no existe')
        }
      } catch {
        return this.failure(context, 'INVALID_BRANCH', 'La sucursal seleccionada no existe')
      }

      const mode = `${args.mode ?? ''}`.toUpperCase()
      let fileKey: string | undefined
      let temporaryFile: Awaited<ReturnType<FileRepository['findByFileKey']>> = null
      let items = [] as ReturnType<QuoteProductValidator['validate']>['items']

      if (mode === 'FILE') {
        const confirmedAttachment = context.turnContext.attachment
        fileKey = `${args.file_key ?? ''}`.trim()

        if (!confirmedAttachment?.confirmed || !fileKey || confirmedAttachment.fileKey !== fileKey) {
          return this.failure(context, 'FILE_NOT_CONFIRMED', 'El archivo no coincide con el archivo confirmado por el cliente')
        }

        temporaryFile = await this.fileRepository.findByFileKey(fileKey)
        if (!temporaryFile || temporaryFile.chatThreadId !== context.chatThreadId) {
          return this.failure(context, 'FILE_NOT_FOUND', 'El archivo confirmado ya no esta disponible')
        }
      } else if (mode === 'TEXT') {
        const validation = this.validator.validate(args.items ?? [])
        if (!validation.valid) {
          return {
            tool_call_id: context.action.id,
            output: JSON.stringify({
              success: false,
              code: 'INVALID_ITEMS',
              validation
            })
          }
        }
        items = validation.items
      } else {
        return this.failure(context, 'INVALID_MODE', 'El tipo de solicitud no es valido')
      }

      const customerResolution = await this.resolveCustomer(context, args)
      if (customerResolution.success === false) {
        return this.failure(context, 'CUSTOMER_DATA_REQUIRED', customerResolution.message, {
          missingFields: customerResolution.missingFields
        })
      }

      const processingMessage = 'Perfecto, dame un momento en lo que genero tu solicitud...'
      await this.sendAndStoreMessage(context, processingMessage)

      if (temporaryFile && fileKey) {
        await this.fileStorageService.uploadBuffer({
          key: fileKey,
          body: temporaryFile.buffer,
          contentType: temporaryFile.mimeType,
          metadata: {
            originalFilename: encodeURIComponent(temporaryFile.originalFilename ?? fileKey),
            source: 'whatsapp'
          }
        })
      }

      const quote = await new SaveCustomerQuoteUseCase(
        this.quoteRepository,
        this.customerRepository
      ).execute({
        customerId: customerResolution.customerId,
        name: customerResolution.customerData.name,
        lastname: customerResolution.customerData.lastname,
        email: customerResolution.customerData.email,
        phone: customerResolution.customerData.phone,
        phoneWa: context.phoneWa,
        location: customerResolution.customerData.location,
        company: customerResolution.customerData.company,
        items,
        fileKey,
        branchId: args.branch_id
      })

      if (!quote) throw new Error('No fue posible recuperar la cotizacion creada')

      const chatThread = await this.chatThreadRepository.addCustomer(
        context.conversationId,
        quote.customerId
      )
      const [updateError, updateQuoteDto] = UpdateQuoteDto.execute({ chatThreadId: chatThread.id })
      if (!updateError && updateQuoteDto) {
        await this.quoteRepository.updateQuote(quote.id, updateQuoteDto)
      }

      if (temporaryFile) {
        await this.fileRepository.deleteFile(temporaryFile.id)
      }

      const confirmationMessage = `Tu solicitud quedo registrada con el numero de cotizacion COT-${quote.quoteNumber}. Muy pronto el area de Ventas te enviara los precios y tiempos de entrega. Gracias por confiar en nosotros.`
      await this.sendAndStoreMessage(context, confirmationMessage)

      try {
        const { summary } = await new SummarizeConversationUseCase(
          this.quoteRepository,
          new OpenAiFunctinsService()
        ).execute(quote.id)
        await this.notifyAboutQuote(quote, summary)
      } catch (error) {
        console.error('[CreateQuoteRequestHandler] Error al resumir o notificar:', error)
      }

      return {
        tool_call_id: context.action.id,
        output: JSON.stringify({
          success: true,
          quoteNumber: quote.quoteNumber,
          messageAlreadySent: true
        })
      }
    } catch (error) {
      console.error('[CreateQuoteRequestHandler]', error)
      return this.failure(
        context,
        'CREATE_QUOTE_FAILED',
        error instanceof Error ? error.message : 'No fue posible crear la solicitud'
      )
    }
  }

  private async resolveCustomer(context: ToolCallContext, args: CreateQuoteRequestArguments): Promise<
    | { success: true; customerId?: string; customerData: { name: string; lastname: string; email: string; phone: string; location: string; company: string } }
    | { success: false; message: string; missingFields: string[] }
  > {
    const existing = context.turnContext.customer.customer
    const values = {
      name: existing?.name?.trim() || `${args.customer_name ?? ''}`.trim(),
      lastname: existing?.lastname?.trim() || `${args.customer_lastname ?? ''}`.trim(),
      email: existing?.email?.trim() || `${args.email ?? ''}`.trim(),
      phone: existing?.phone?.trim() || `${args.phone ?? ''}`.trim() || context.phoneWa,
      location: existing?.location?.trim() || `${args.location ?? ''}`.trim(),
      company: existing?.company?.trim() || `${args.company ?? ''}`.trim()
    }
    const required = [
      ['name', 'nombre'],
      ['lastname', 'apellidos'],
      ['email', 'correo'],
      ['phone', 'telefono'],
      ['location', 'ubicacion']
    ] as const
    const missingFields = required
      .filter(([field]) => !values[field])
      .map(([, label]) => label)

    if (missingFields.length > 0) {
      return {
        success: false,
        message: 'Faltan datos del cliente',
        missingFields
      }
    }

    if (existing) {
      const fillsMissingData = context.turnContext.customer.missingFields.length > 0
      if (fillsMissingData) {
        await this.customerRepository.updateCustomerByWhatsappNumber(context.phoneWa, values)
      }
      return { success: true, customerId: existing.id, customerData: values }
    }

    return { success: true, customerData: values }
  }

  private async sendAndStoreMessage(context: ToolCallContext, content: string): Promise<void> {
    const result = await this.messageService.createWhatsAppMessage({
      to: context.phoneWa,
      body: content
    })
    await this.messageRepository.createAssistantMessage({
      content,
      chatThreadId: context.chatThreadId,
      to: context.phoneWa,
      providerMessageId: result.providerMessageSid,
      status: 'QUEUED'
    })
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
      console.error('[CreateQuoteRequestHandler] Error en notificaciones:', error)
    }
  }

  private failure(
    context: ToolCallContext,
    code: string,
    message: string,
    extra: Record<string, unknown> = {}
  ): ToolCallOutput {
    return {
      tool_call_id: context.action.id,
      output: JSON.stringify({ success: false, code, message, ...extra })
    }
  }
}
