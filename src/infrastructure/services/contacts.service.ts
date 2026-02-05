import { WhatsappTemplate } from '../template/whatsapp/whatsapp-templates';
import { EmailService } from './mail.service';
import { WhatsAppNotificationService } from './whatsapp-notification.service';

interface Contact {
  name: string
  phone: string
  email: string
}

type SendPropsType = {
  summary: string,
  url: string
}


export class ContactService {

  private readonly contacts: Array<Contact> = [
    {
      phone: '5215579044897',
      name: 'German Barranco',
      email: "gbarranco@tuvansa.com.mx"
    },
    {
      phone: '5215541142762',
      name: 'Erick',
      email: "eeramirez@tuvansa.com.mx"
    },
    {
      phone: '5216243828879',
      name: 'Luis Quintero',
      email: "lquintero@tuvansa.com.mx"
    },
    {
      phone: '525541141306',
      name: 'Roy Grinberg',
      email: "rgrinberg@tuvansa.com.mx"
    },
    {
      phone: '525522406714',
      name: 'Marcos Avalos',
      email: "mavalos@tuvansa.com.mx"
    },
    {
      phone: "528116603993",
      name: "Alejandro Lozano",
      email: "alozano@tuvansa.com.mx"
    },
    {
      phone: "5215544129884",
      name: "Christian Gonzalez",
      email: "cgonzalez@tuvansa.com.mx"
    }
  ]

  constructor(
    private readonly emailService: EmailService,
    private readonly whatsAppNotificationService: WhatsAppNotificationService
  ) {

  }


  async sendEmail(sendProps: SendPropsType) {

    const { summary, url } = sendProps


    const html = this.htmlNewQuoteResponse({ summary, url })

    try {

      for (let contac of this.contacts) {

        await this.emailService.sendEmail({
          to: contac.email,
          subject: "Nueva cotización asistente IA  desde WhatsApp Tuvansa ",
          htmlBody: html,
        })

      }

    } catch (error) {

      throw new Error('Error AL madar email [ContactService]')

    }


  }


  async sendWhatsApp(sendProps: SendPropsType) {

    const { summary, url } = sendProps

    console.log({ sendProps })

    try {

      for (const contact of this.contacts) {

        await this.whatsAppNotificationService.sendTemplateMessage(
          WhatsappTemplate.QUOTE_WEB_NOTIFICATION_ICONS, {
          quote: { summary },
          url,
          to: contact.phone
        })

      }

    } catch (error) {
      console.log(error)
      throw new Error('Error AL madar email [ContactService]')
    }

  }


  private htmlNewQuoteResponse({ summary, url }: { summary: string, url: string }) {


    return `
    
      <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Nueva Cotización Web desde Tuvansa IA</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
          font-family: Arial, Helvetica, sans-serif;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 24px 20px;
          border-radius: 4px;
        }
        h1 {
          font-size: 20px;
          margin-bottom: 16px;
          color: #333333;
        }
        p {
          font-size: 14px;
          line-height: 1.5;
          color: #444444;
          margin: 0 0 12px 0;
        }
        .summary {
          font-weight: bold;
          margin-top: 8px;
          margin-bottom: 16px;
        }
        .btn {
          display: inline-block;
          padding: 10px 18px;
          background-color: #007bff;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
        }
        .footer {
          font-size: 12px;
          color: #888888;
          margin-top: 20px;
        }
        @media only screen and (max-width: 600px) {
          .container {
            padding: 16px 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <p><strong>Asunto:</strong> Nueva Cotización Web desde Tuvansa IA</p>

        <h1>¡Hola!</h1>

        <p>Tienes una nueva cotización generada desde la web Tuvansa IA.</p>

        <p class="summary">Resumen</p>
        <p class="summary">
           ${summary}
        </p>

        <p>
          Accede a la cotización completa haciendo clic aquí:
        </p>

        <p>
          <a href="${url}" class="btn" target="_blank" rel="noopener noreferrer">
            Ver cotización completa
          </a>
        </p>

        <p class="footer">
          Gracias.
        </p>
      </div>
    </body>
    </html>

    `
  }


}