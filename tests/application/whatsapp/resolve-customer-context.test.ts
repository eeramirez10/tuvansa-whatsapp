import test from 'node:test'
import assert from 'node:assert/strict'
import { ResolveCustomerContextUseCase } from '../../../src/application/use-cases/whatsApp/resolve-customer-context.use-case'
import type { CustomerRepository } from '../../../src/domain/repositories/customer.repository'

test('busca obligatoriamente al cliente por el numero normalizado de WhatsApp', async () => {
  let searchedPhone = ''
  const repository = {
    findByWhatsappPhone: async (phone: string) => {
      searchedPhone = phone
      return {
        id: 'customer-1',
        name: 'Erick',
        lastname: 'Ramirez',
        email: 'erick@example.com',
        phone,
        phoneWa: phone,
        location: 'Monterrey',
        company: 'TUVANSA',
        createdAt: new Date()
      }
    }
  } as unknown as CustomerRepository

  const context = await new ResolveCustomerContextUseCase(repository)
    .execute('whatsapp:+52 81 1234 5678')

  assert.equal(searchedPhone, '528112345678')
  assert.equal(context.exists, true)
  assert.equal(context.customer?.name, 'Erick')
  assert.deepEqual(context.missingFields, [])
})

test('marca un cliente nuevo sin dejar la decision a Responses', async () => {
  const repository = {
    findByWhatsappPhone: async () => null
  } as unknown as CustomerRepository

  const context = await new ResolveCustomerContextUseCase(repository)
    .execute('5215555555555')

  assert.equal(context.exists, false)
  assert.equal(context.customer, null)
  assert.deepEqual(context.missingFields, ['nombre', 'apellidos', 'correo', 'ubicacion'])
})
