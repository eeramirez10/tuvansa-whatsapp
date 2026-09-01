import test from 'node:test'
import assert from 'node:assert/strict'
import { CreateQuoteRequestHandler } from '../../../src/application/use-cases/whatsApp/tool-handlers/create-quote-request.handler'
import { QuoteProductValidator } from '../../../src/domain/services/quote-product-validator'

const turnContext = {
  customer: {
    exists: true,
    customer: {
      id: 'customer-1',
      name: 'Erick',
      lastname: 'Ramirez',
      email: 'erick@example.com',
      phone: '5215555555555',
      location: 'Monterrey',
      company: 'TUVANSA'
    },
    missingFields: []
  },
  attachment: null
}

const createHandler = (branchRepository: any = {}) => new CreateQuoteRequestHandler(
  {} as any,
  {} as any,
  {} as any,
  branchRepository,
  {} as any,
  {} as any,
  {
    createWhatsAppMessage: async () => {
      throw new Error('No debe enviar mensajes para una solicitud invalida')
    }
  } as any,
  {} as any,
  {} as any,
  new QuoteProductValidator()
)

const execute = async (handler: CreateQuoteRequestHandler, args: Record<string, unknown>) => {
  const result = await handler.execute({
    action: {
      id: 'call-1',
      function: {
        name: 'create_quote_request',
        arguments: JSON.stringify(args)
      }
    },
    phoneWa: '5215555555555',
    conversationId: 'conv-1',
    chatThreadId: 'chat-1',
    turnContext
  })

  return JSON.parse(result.output)
}

test('no crea una cotizacion sin confirmacion explicita', async () => {
  const output = await execute(createHandler(), {
    mode: 'TEXT',
    confirmation_obtained: false,
    branch_id: 'branch-1',
    items: []
  })

  assert.equal(output.success, false)
  assert.equal(output.code, 'CONFIRMATION_REQUIRED')
})

test('vuelve a validar productos antes de crear una cotizacion escrita', async () => {
  const output = await execute(createHandler({
    getBranch: async () => ({ id: 'branch-1' })
  }), {
    mode: 'TEXT',
    confirmation_obtained: true,
    branch_id: 'branch-1',
    items: [{
      family: 'TUBERIA',
      description: 'Tubo de 6 pulgadas',
      quantity: 10,
      um: 'METRO',
      specifications: [
        { name: 'diametro', value: '6 pulgadas' }
      ]
    }]
  })

  assert.equal(output.success, false)
  assert.equal(output.code, 'INVALID_ITEMS')
  assert.deepEqual(output.validation.issues[0].missingFields, [
    'material',
    'cedula o espesor',
    'con costura o sin costura'
  ])
})

test('rechaza un archivo diferente al confirmado por el webhook', async () => {
  const output = await execute(createHandler({
    getBranch: async () => ({ id: 'branch-1' })
  }), {
    mode: 'FILE',
    confirmation_obtained: true,
    branch_id: 'branch-1',
    file_key: 'otro-archivo.pdf',
    items: []
  })

  assert.equal(output.success, false)
  assert.equal(output.code, 'FILE_NOT_CONFIRMED')
})

test('registra un archivo confirmado reutilizando al cliente existente', async () => {
  let uploadedKey = ''
  let deletedFileId = ''
  let createdCustomerId = ''
  const sentMessages: string[] = []
  const quote = {
    id: 'quote-1',
    quoteNumber: 101,
    customerId: 'customer-1',
    branchId: 'branch-1',
    fileKey: 'solicitud.pdf',
    items: []
  }
  const quoteRepository = {
    createQuote: async (input: any) => {
      createdCustomerId = input.customerId
      return quote
    },
    findByQuoteNumber: async () => quote,
    updateQuote: async (_id: string, input: any) => ({ ...quote, ...input }),
    getQuote: async () => quote
  }
  const customerRepository = {
    getById: async () => ({
      id: 'customer-1',
      name: 'Erick',
      lastname: 'Ramirez',
      email: 'erick@example.com',
      phone: '5215555555555',
      phoneWa: '5215555555555',
      location: 'Monterrey',
      company: 'TUVANSA'
    })
  }
  const handler = new CreateQuoteRequestHandler(
    quoteRepository as any,
    customerRepository as any,
    { addCustomer: async () => ({ id: 'chat-1' }) } as any,
    { getBranch: async () => ({ id: 'branch-1' }) } as any,
    {
      findByFileKey: async () => ({
        id: 'temp-1',
        fileKey: 'solicitud.pdf',
        originalFilename: 'solicitud.pdf',
        buffer: new Uint8Array([1, 2, 3]),
        mimeType: 'application/pdf',
        chatThreadId: 'chat-1'
      }),
      deleteFile: async (id: string) => { deletedFileId = id }
    } as any,
    {
      uploadBuffer: async (input: any) => {
        uploadedKey = input.key
        return { key: input.key }
      }
    } as any,
    {
      createWhatsAppMessage: async ({ body }: any) => {
        sentMessages.push(body)
        return { providerMessageSid: `SM${sentMessages.length}` }
      }
    } as any,
    { createAssistantMessage: async () => undefined } as any,
    { getNotificationRecipients: async () => [] } as any,
    new QuoteProductValidator()
  )

  const result = await handler.execute({
    action: {
      id: 'call-file',
      function: {
        name: 'create_quote_request',
        arguments: JSON.stringify({
          mode: 'FILE',
          confirmation_obtained: true,
          branch_id: 'branch-1',
          file_key: 'solicitud.pdf',
          items: []
        })
      }
    },
    phoneWa: '5215555555555',
    conversationId: 'conv-1',
    chatThreadId: 'chat-1',
    turnContext: {
      ...turnContext,
      attachment: {
        fileKey: 'solicitud.pdf',
        originalFilename: 'solicitud.pdf',
        confirmed: true
      }
    }
  })
  const output = JSON.parse(result.output)

  assert.equal(output.success, true)
  assert.equal(output.quoteNumber, 101)
  assert.equal(createdCustomerId, 'customer-1')
  assert.equal(uploadedKey, 'solicitud.pdf')
  assert.equal(deletedFileId, 'temp-1')
  assert.equal(sentMessages.length, 2)
})
