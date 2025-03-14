import { envs } from "../../config/envs";
import twilio from 'twilio'
import { MessageService } from "../../domain/services/message.service";


interface SendWhatsAppMessageOptions {
  body:  any[]
  to: string
}

export class TwilioService implements MessageService {



  private client: twilio.Twilio = twilio(envs.TWILIO_ACCOUNT_SID, envs.TWILIO_AUTH_TOKEN)

  constructor() {


  }

  async createWhatsAppMessage(options: SendWhatsAppMessageOptions) {

    const { body, to } = options

    const message = await this.client.messages.create({
      body: body.toString(),
      to: `whatsapp:+${to}`, // Text your number
      from: 'whatsapp:+5215596603295', // From a valid Twilio number
    })

   

  }

}