import test from 'node:test'
import assert from 'node:assert/strict'
import { EnsureChatThreadForPhoneUseCase } from '../../../src/application/use-cases/whatsApp/ensure-chat-thread-for-phone.use-case'
import type { ChatThreadRepository } from '../../../src/domain/repositories/chat-thread.repository'
import type { LanguageModelService } from '../../../src/domain/services/language-model.service'

const legacyThread = {
  id: 'chat-1',
  openAiThreadId: 'thread_legacy',
  clientPhoneNumber: '5215555555555',
  status: 'ACTIVE',
  createdAt: new Date(),
  lastInteraction: new Date(),
  location: null,
  customerId: null,
  isProcessing: false
}

test('migra un thread legacy a una conversacion e importa el historial local', async () => {
  let importedHistory: unknown
  let storedConversationId = ''
  let processingReset = false

  const languageModel = {
    createConversation: async (history: unknown) => {
      importedHistory = history
      return 'conv_new'
    }
  } as unknown as LanguageModelService

  const repository = {
    findByPhone: async () => legacyThread,
    getRecentMessages: async () => [
      { role: 'user', content: 'Necesito dos valvulas' },
      { role: 'assistant', content: 'Claro, dime tu ciudad' }
    ],
    updateExternalConversationId: async (_chatThreadId: string, conversationId: string) => {
      storedConversationId = conversationId
      return { ...legacyThread, openAiThreadId: conversationId }
    },
    setProcessing: async () => {
      processingReset = true
    }
  } as unknown as ChatThreadRepository

  const result = await new EnsureChatThreadForPhoneUseCase(
    languageModel,
    repository
  ).execute(legacyThread.clientPhoneNumber)

  assert.equal(result.conversationId, 'conv_new')
  assert.equal(storedConversationId, 'conv_new')
  assert.equal(processingReset, true)
  assert.deepEqual(importedHistory, [
    { role: 'user', content: 'Necesito dos valvulas' },
    { role: 'assistant', content: 'Claro, dime tu ciudad' }
  ])
})

test('reutiliza una conversacion ya migrada sin crear otra', async () => {
  let createCalls = 0
  const migratedThread = { ...legacyThread, openAiThreadId: 'conv_existing' }

  const languageModel = {
    createConversation: async () => {
      createCalls += 1
      return 'conv_unexpected'
    }
  } as unknown as LanguageModelService

  const repository = {
    findByPhone: async () => migratedThread,
    setProcessing: async () => undefined
  } as unknown as ChatThreadRepository

  const result = await new EnsureChatThreadForPhoneUseCase(
    languageModel,
    repository
  ).execute(migratedThread.clientPhoneNumber)

  assert.equal(result.conversationId, 'conv_existing')
  assert.equal(createCalls, 0)
})
