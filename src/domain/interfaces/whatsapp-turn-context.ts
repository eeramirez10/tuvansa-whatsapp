export interface WhatsAppCustomerSnapshot {
  id: string
  name: string
  lastname: string
  email: string
  phone: string
  location: string
  company: string
}

export interface WhatsAppCustomerContext {
  exists: boolean
  customer: WhatsAppCustomerSnapshot | null
  missingFields: string[]
}

export interface WhatsAppAttachmentContext {
  fileKey: string
  originalFilename: string
  confirmed: boolean
}

export interface WhatsAppTurnContext {
  customer: WhatsAppCustomerContext
  attachment: WhatsAppAttachmentContext | null
}
