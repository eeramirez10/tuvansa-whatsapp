import { envs } from "../../config/envs";
import twilio from 'twilio'
import { DeleteFileDto, GetFileFromUrlResult, MessageService, SaveFilesDto, WhatsAppSendMediaParams, WhatsAppSendMediaResult } from "../../domain/services/message.service";
import { pipeline } from 'node:stream/promises';  // solo pipeline / finished
import { Readable } from 'node:stream';          // aquí está fromWeb()



const PUBLIC_DIR = './public/quotes';
import path from "path";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { Buffer } from "node:buffer";

interface SendWhatsAppMessageOptions {
  body?: string
  to: string
  mediaUrl?: string[]
  contentSid?: string
  contentVariables?: string
}

export class TwilioService implements MessageService {



  private client: twilio.Twilio = twilio(envs.TWILIO_ACCOUNT_SID, envs.TWILIO_AUTH_TOKEN)

  constructor() { }



  async sendMediaMessage(options: WhatsAppSendMediaParams): Promise<WhatsAppSendMediaResult> {
    const {
      to,
      body,
      mediaUrl,
      filename,
      statusCallbackUrl,

    } = options

    const msg = await this.client.messages.create({
      to: `whatsapp:+${to}`, // Text your number
      from: `whatsapp:${envs.TWILIO_NUMBER}`, // From a valid Twilio number
      body,
      mediaUrl: [mediaUrl],
      statusCallback: statusCallbackUrl,
    })

    return {
      providerMessageSid: msg.sid
    }
  }


  async deleteFileFromApi(mediaItem: DeleteFileDto): Promise<void> {


    await this.client.api.accounts(envs.TWILIO_ACCOUNT_SID).messages(mediaItem.MessageSid)
      .media(mediaItem.mediaSid).remove()

  }


  async getFileFromUrl(mediaUrl: string): Promise<GetFileFromUrlResult> {
    const token = Buffer
      .from(`${envs.TWILIO_ACCOUNT_SID}:${envs.TWILIO_AUTH_TOKEN}`)
      .toString('base64');

    const metadataFilename = await this.fetchFilenameFromMediaMetadata(mediaUrl, token)

    const res = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        // 'Accept': 'application/json'
      }
    });


    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentDisposition = res.headers.get('content-disposition')
    const headerFilename =
      this.extractFilenameFromContentDisposition(contentDisposition) ??
      res.headers.get('x-original-filename') ??
      res.headers.get('x-file-name') ??
      res.headers.get('x-filename') ??
      undefined

    const originalFilename = metadataFilename ?? headerFilename

    if (!res.body) {
      throw new Error('Empty media response body from Twilio')
    }

    return {
      stream: res.body as ReadableStream<Uint8Array<ArrayBufferLike>>,
      originalFilename: originalFilename ?? undefined
    }
  }

  private async fetchFilenameFromMediaMetadata(mediaUrl: string, token: string): Promise<string | undefined> {
    try {
      const metadataResponse = await fetch(mediaUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Accept': 'application/json'
        }
      })

      if (!metadataResponse.ok) return undefined

      const contentType = metadataResponse.headers.get('content-type') ?? ''
      if (!contentType.toLowerCase().includes('application/json')) return undefined

      const payload = await metadataResponse.json() as Record<string, unknown>

      const candidates = [
        payload?.filename,
        payload?.file_name,
        payload?.original_filename
      ]

      const match = candidates.find((value) =>
        typeof value === 'string' &&
        value.trim().length > 0 &&
        this.isLikelyFilename(value)
      )
      return match as string | undefined
    } catch (error) {
      return undefined
    }
  }

  private isLikelyFilename(value: string): boolean {
    const clean = path.basename(value.trim())
    if (!clean) return false
    return path.extname(clean).length > 1
  }

  private extractFilenameFromContentDisposition(contentDisposition: string | null): string | null {
    if (!contentDisposition) return null

    // RFC 5987: filename*=UTF-8''encoded_name.pdf
    const rfc5987Match = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i)
    if (rfc5987Match?.[1]) {
      const raw = rfc5987Match[1].trim().replace(/^UTF-8''/i, '').replace(/^"(.*)"$/, '$1')
      try {
        return decodeURIComponent(raw)
      } catch {
        return raw
      }
    }

    const filenameMatch = contentDisposition.match(/filename\s*=\s*([^;]+)/i)
    if (!filenameMatch?.[1]) return null

    return filenameMatch[1].trim().replace(/^"(.*)"$/, '$1')
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

  async createWhatsAppMessage(options: SendWhatsAppMessageOptions): Promise<WhatsAppSendMediaResult> {

    const { body, to, mediaUrl, contentSid, contentVariables } = options

    const message = await this.client.messages.create({
      body: body,
      to: `whatsapp:+${to}`, // Text your number
      from: `whatsapp:${envs.TWILIO_NUMBER}`, // From a valid Twilio number
      mediaUrl: mediaUrl,
      // forceDelivery: true,
      contentSid,
      contentVariables

    })

    return {
      providerMessageSid: message.sid
    }



  }

}
