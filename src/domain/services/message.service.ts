interface SendWhatsAppMessageOptions {
  body: any []
  to:string
}

export abstract class MessageService {

  abstract createWhatsAppMessage (options:SendWhatsAppMessageOptions): Promise<void>

}