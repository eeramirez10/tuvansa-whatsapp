import { WhatsAppCustomerContext } from '../../../domain/interfaces/whatsapp-turn-context'
import { CustomerRepository } from '../../../domain/repositories/customer.repository'

const CUSTOMER_FIELDS = [
  ['name', 'nombre'],
  ['lastname', 'apellidos'],
  ['email', 'correo'],
  ['phone', 'telefono'],
  ['location', 'ubicacion']
] as const

export class ResolveCustomerContextUseCase {
  constructor(private readonly customerRepository: CustomerRepository) { }

  async execute(phoneWa: string): Promise<WhatsAppCustomerContext> {
    const normalizedPhone = this.normalizePhone(phoneWa)
    const customer = await this.customerRepository.findByWhatsappPhone(normalizedPhone)

    if (!customer) {
      return {
        exists: false,
        customer: null,
        missingFields: ['nombre', 'apellidos', 'correo', 'ubicacion']
      }
    }

    const missingFields = CUSTOMER_FIELDS
      .filter(([field]) => !`${customer[field] ?? ''}`.trim())
      .map(([, label]) => label)

    return {
      exists: true,
      customer: {
        id: customer.id,
        name: customer.name,
        lastname: customer.lastname,
        email: customer.email,
        phone: customer.phone,
        location: customer.location,
        company: customer.company ?? ''
      },
      missingFields
    }
  }

  private normalizePhone(value: string): string {
    return `${value ?? ''}`.replace(/^whatsapp:/i, '').replace(/\D/g, '')
  }
}
