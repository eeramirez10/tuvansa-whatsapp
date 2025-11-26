import { MessageService } from '../../domain/services/message.service';
import { QuoteTemplateData, WHATSAPP_TEMPLATES, WhatsappTemplate } from '../template/whatsapp/whatsapp-templates';

// type QuoteTemplateData = {
//   to: string;
//   version?: {
//     customer: { name: string; lastname: string };
//     quote: { quoteNumber: string | number };
//   };
//   quote?: any; // tu tipo de Quote
//   presignedUrl?: string;
//   mediaUrl?: string;

// };

export class WhatsAppNotificationService {

  constructor(
    private readonly messageService: MessageService
  ) { }

  async sendTemplateMessage(template: WhatsappTemplate, data: QuoteTemplateData) {

    const confiig = WHATSAPP_TEMPLATES[template]

    if (!confiig) {
      throw new Error(`Template no configurado: ${template}`)
    }

    const variables = confiig.buildVars(data)

    try {

      return await this.messageService.createWhatsAppMessage({
        to: data.to,
        contentSid: confiig.contentSid,
        contentVariables: JSON.stringify(variables)
      })

    } catch (error) {
      console.error(error);
      console.log(`Error al enviar mensaje ${template} a ${data.to}`);
      throw error;
    }
  }
}