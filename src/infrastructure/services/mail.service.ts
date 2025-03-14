
import nodemailer from 'nodemailer'
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { envs } from '../../config/envs';


export interface SendMailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
}


export class EmailService {

  private transporter = nodemailer.createTransport({
    host: 'securemail25.carrierzone.com',
    port: 25,
    secure: false,
    auth: {
      user: envs.EMAIL_ACCOUNT,
      pass: envs.EMAIL_PASSWORD,
    },
  })

  constructor() { }

  async sendEmail(options: SendMailOptions) {

    const { to, subject, htmlBody } = options;


    const info = await this.transporter.sendMail({
      from: envs.EMAIL_ACCOUNT,
      to, // list of receivers
      subject: subject, // Subject line
      html: htmlBody,
    })

    console.log("Message sent: %s", info.messageId);
  }

  generarBodyCorreo(extractedData: QuoteEntity) {

    const { customer, items } = extractedData



    // Generamos las filas de la tabla para cada artículo
    const itemsHTML = items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.ean}</td>
        <td>${item.codigo}</td>
        <td>${item.quantity}</td>
        <td>${item.um}</td>
      </tr>
    `).join('')

    // Armamos el cuerpo completo en HTML
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1>Datos del Cliente</h1>
        <p><strong>Nombre:</strong> ${customer?.name} ${customer?.lastname}</p>
        <p><strong>Email:</strong> ${customer?.email}</p>
        <p><strong>Teléfono:</strong> ${customer?.phone}</p>
        <p><strong>Ubicación:</strong> ${customer?.location}</p>
  
        <h2>Artículos solicitados</h2>
        <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>EAN</th>
              <th>Código</th>
              <th>Cantidad</th>
              <th>U.M.</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>
    `
    return htmlBody
  }
}