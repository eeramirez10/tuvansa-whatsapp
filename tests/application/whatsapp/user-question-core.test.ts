import test from 'node:test'
import assert from 'node:assert/strict'
import { UserQuestionCoreUseCase } from '../../../src/application/use-cases/whatsApp/user-question-core.use-case'
import type { ToolCallHandlerFactory } from '../../../src/application/use-cases/whatsApp/tool-handlers/tool-call-handler.factory'
import type { MessageRepository } from '../../../src/domain/repositories/message-repository'
import type { LanguageModelService } from '../../../src/domain/services/language-model.service'
import type { MessageService } from '../../../src/domain/services/message.service'

test('ejecuta herramientas de Responses y envia la respuesta final por WhatsApp', async () => {
  const userMessages: unknown[] = []
  const assistantMessages: unknown[] = []
  const sentMessages: unknown[] = []
  let submittedOutputs: unknown
  let handlerContext: any
  let createResponseOptions: any
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

  const languageModel = {
    createResponse: async (options: unknown) => {
      createResponseOptions = options
      return {
        responseId: 'resp_1',
        outputText: '',
        toolCalls: [{
          callId: 'call_1',
          name: 'get_branches',
          arguments: '{}'
        }]
      }
    },
    submitToolOutputs: async (options: unknown) => {
      submittedOutputs = options
      return {
        responseId: 'resp_2',
        outputText: 'Tenemos sucursales disponibles. ¿Cual prefieres?',
        toolCalls: []
      }
    }
  } as unknown as LanguageModelService

  const handlerFactory = {
    getHandler: () => ({
      execute: async (context: unknown) => {
        handlerContext = context
        return {
          tool_call_id: 'call_1',
          output: '[{"id":"branch-1","name":"Monterrey"}]'
        }
      }
    })
  } as unknown as ToolCallHandlerFactory

  const messageService = {
    createWhatsAppMessage: async (message: unknown) => {
      sentMessages.push(message)
      return { providerMessageSid: 'SM123' }
    }
  } as unknown as MessageService

  const messageRepository = {
    createUserMessage: async (message: unknown) => {
      userMessages.push(message)
    },
    createAssistantMessage: async (message: unknown) => {
      assistantMessages.push(message)
    }
  } as unknown as MessageRepository

  await new UserQuestionCoreUseCase(
    languageModel,
    messageService,
    handlerFactory,
    messageRepository
  ).execute({
    phoneWa: '5215555555555',
    question: 'Quiero cotizar una valvula',
    conversationId: 'conv_1',
    chatThreadId: 'chat-1',
    context: turnContext
  })

  assert.deepEqual(createResponseOptions.context, turnContext)
  assert.equal(handlerContext.conversationId, 'conv_1')
  assert.deepEqual(handlerContext.turnContext, turnContext)
  assert.equal(handlerContext.action.function.name, 'get_branches')
  assert.deepEqual(submittedOutputs, {
    conversationId: 'conv_1',
    endUserId: '5215555555555',
    context: turnContext,
    toolOutputs: [{
      callId: 'call_1',
      output: '[{"id":"branch-1","name":"Monterrey"}]'
    }]
  })
  assert.equal(userMessages.length, 1)
  assert.deepEqual(sentMessages, [{
    to: '5215555555555',
    body: 'Tenemos sucursales disponibles. ¿Cual prefieres?'
  }])
  assert.deepEqual(assistantMessages, [{
    content: 'Tenemos sucursales disponibles. ¿Cual prefieres?',
    chatThreadId: 'chat-1',
    to: '5215555555555',
    providerMessageId: 'SM123',
    status: 'QUEUED'
  }])
})
