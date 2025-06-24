"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const envs_1 = require("../../config/envs");
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransport({
            service: envs_1.envs.MAIL_SERVICE,
            host: envs_1.envs.EMAIL_HOST,
            port: 587,
            secure: false,
            auth: {
                user: envs_1.envs.EMAIL_ACCOUNT,
                pass: envs_1.envs.EMAIL_PASSWORD,
            },
        });
    }
    sendEmail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { to, subject, htmlBody, attachments } = options;
            const info = yield this.transporter.sendMail({
                from: envs_1.envs.EMAIL_ACCOUNT,
                to, // list of receivers
                subject: subject, // Subject line
                html: htmlBody,
                attachments
            });
            console.log("Message sent: %s", info.messageId);
        });
    }
    generarBodyCorreo(extractedData) {
        const { customer, items } = extractedData;
        // Generamos las filas de la tabla para cada artículo
        const itemsHTML = items.length > 0 ? items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.ean}</td>
        <td>${item.codigo}</td>
        <td>${item.quantity}</td>
        <td>${item.um}</td>
      </tr>
    `).join('') : null;
        const quoteItems = itemsHTML ? `
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
    
    
    ` : '';
        // Armamos el cuerpo completo en HTML
        const htmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1>Datos del Cliente</h1>
        <p><strong>Nombre:</strong> ${customer === null || customer === void 0 ? void 0 : customer.name} ${customer === null || customer === void 0 ? void 0 : customer.lastname}</p>
        <p><strong>Email:</strong> ${customer === null || customer === void 0 ? void 0 : customer.email}</p>
        <p><strong>Teléfono:</strong> ${customer === null || customer === void 0 ? void 0 : customer.phone}</p>
        <p><strong>Ubicación:</strong> ${customer === null || customer === void 0 ? void 0 : customer.location}</p>

        ${quoteItems}
  
      </div>
    `;
        return htmlBody;
    }
}
exports.EmailService = EmailService;
