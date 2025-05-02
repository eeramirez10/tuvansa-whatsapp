import { envs } from "../../config/envs";
import twilio from 'twilio'
import { DeleteFileDto, MessageService, SaveFilesDto } from "../../domain/services/message.service";



import { pipeline } from 'node:stream/promises';  // solo pipeline / finished
import { Readable } from 'node:stream';          // aquí está fromWeb()



const PUBLIC_DIR = './public/quotes';
import path from "path";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { Buffer } from "node:buffer";


interface SendWhatsAppMessageOptions {
  body: any[]
  to: string
}

export class TwilioService implements MessageService {



  private client: twilio.Twilio = twilio(envs.TWILIO_ACCOUNT_SID, envs.TWILIO_AUTH_TOKEN)

  constructor() { }


  async deleteFileFromApi(mediaItem: DeleteFileDto): Promise<void> {


    await this.client.api.accounts(envs.TWILIO_ACCOUNT_SID).messages(mediaItem.MessageSid)
      .media(mediaItem.mediaSid).remove()

  }


  async getFileFromUrl(mediaUrl: string) {
    const token = Buffer
      .from(`${envs.TWILIO_ACCOUNT_SID}:${envs.TWILIO_AUTH_TOKEN}`)
      .toString('base64');

    const res = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Accept': 'application/json'
      }
    });


    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    return res.body
  }


  async saveFiles(options: SaveFilesDto): Promise<void> {

    const { filename, mediaUrl } = options

    if (!existsSync(PUBLIC_DIR)) {
      mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    const fullPath = path.join(PUBLIC_DIR, filename);
    if (existsSync(fullPath)) return;


    const token = Buffer.from(`${envs.TWILIO_ACCOUNT_SID}:${envs.TWILIO_AUTH_TOKEN}`).toString('base64');

    const res = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Accept': 'application/json'
      }
    });


    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // Convierte ReadableStream web → Node Readable y haz pipe con pipeline
    const nodeStream = Readable.fromWeb(res.body as any);
    const fileStream = createWriteStream(fullPath);

    await pipeline(nodeStream, fileStream);

    this.deleteFileFromApi(options)


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