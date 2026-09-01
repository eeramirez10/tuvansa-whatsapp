import test from 'node:test'
import assert from 'node:assert/strict'
import { splitWhatsAppMessage } from '../../../src/application/use-cases/whatsApp/whatsapp-message-chunker'

test('conserva mensajes cortos en una sola parte', () => {
  assert.deepEqual(splitWhatsAppMessage('Hola, ¿en que puedo ayudarte?'), [
    'Hola, ¿en que puedo ayudarte?'
  ])
})

test('divide mensajes largos sin perder palabras', () => {
  const message = 'uno dos tres cuatro cinco seis siete ocho nueve diez'
  const chunks = splitWhatsAppMessage(message, 18)

  assert.ok(chunks.every((chunk) => chunk.length <= 18))
  assert.equal(chunks.join(' '), message)
})
