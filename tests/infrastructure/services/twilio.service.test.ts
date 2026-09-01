import test from 'node:test'
import assert from 'node:assert/strict'
import type twilio from 'twilio'
import { TwilioService } from '../../../src/infrastructure/services/twilio.service'

const createService = (options: {
  create: (message: unknown) => Promise<{ sid: string }>
  maxAttempts?: number
  retryBaseDelayMs?: number
  sleep?: (delayMs: number) => Promise<void>
}) => {
  const client = {
    messages: {
      create: options.create
    }
  } as unknown as twilio.Twilio

  return new TwilioService({
    client,
    maxAttempts: options.maxAttempts,
    retryBaseDelayMs: options.retryBaseDelayMs,
    sleep: options.sleep
  })
}

test('reintenta errores transitorios de Twilio con espera exponencial', async () => {
  let attempts = 0
  const delays: number[] = []
  const service = createService({
    create: async () => {
      attempts += 1
      if (attempts < 3) throw Object.assign(new Error('Bad Gateway'), { status: 502 })
      return { sid: 'SM-success' }
    },
    retryBaseDelayMs: 10,
    sleep: async (delayMs) => {
      delays.push(delayMs)
    }
  })

  const result = await service.createWhatsAppMessage({
    to: '5215555555555',
    body: 'Mensaje de prueba'
  })

  assert.equal(result.providerMessageSid, 'SM-success')
  assert.equal(attempts, 3)
  assert.deepEqual(delays, [10, 20])
})

test('no reintenta errores terminales de Twilio', async () => {
  let attempts = 0
  const expectedError = Object.assign(new Error('Bad Request'), { status: 400 })
  const service = createService({
    create: async () => {
      attempts += 1
      throw expectedError
    },
    sleep: async () => {
      throw new Error('sleep should not be called')
    }
  })

  await assert.rejects(
    service.createWhatsAppMessage({ to: '5215555555555', body: 'Mensaje' }),
    (error) => error === expectedError
  )
  assert.equal(attempts, 1)
})

test('detiene los reintentos al alcanzar el maximo configurado', async () => {
  let attempts = 0
  const delays: number[] = []
  const service = createService({
    create: async () => {
      attempts += 1
      throw Object.assign(new Error('Service Unavailable'), { status: 503 })
    },
    maxAttempts: 3,
    retryBaseDelayMs: 5,
    sleep: async (delayMs) => {
      delays.push(delayMs)
    }
  })

  await assert.rejects(
    service.createWhatsAppMessage({ to: '5215555555555', body: 'Mensaje' }),
    (error: unknown) => (
      error instanceof Error &&
      (error as Error & { status?: number }).status === 503
    )
  )
  assert.equal(attempts, 3)
  assert.deepEqual(delays, [5, 10])
})
