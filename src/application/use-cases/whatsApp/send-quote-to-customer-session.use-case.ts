import { MessageService, WhatsAppSendMediaResult } from '../../../domain/services/message.service';
import { FileStorageService } from '../../../domain/services/file-storage.service';
import { PrismaClient } from '@prisma/client';
import { WhatsappWindow } from '../../../infrastructure/utils/whatsapp-window';
import { WhatsAppNotificationService } from '../../../infrastructure/services/whatsapp-notification.service';
import { WhatsappTemplate } from '../../../infrastructure/template/whatsapp/whatsapp-templates';

const prisma = new PrismaClient()



export interface SendQuotePdfWhatsAppInput {

  quoteVersionId: string;
  artifactId?: string;

}


export class SendQuoteToCustomerSessionUseCase {

  constructor(
    private readonly messageService: MessageService,
    private readonly fileStorageService: FileStorageService,
    private readonly whatsAppNotificationService: WhatsAppNotificationService
  ) { }


  async execute(input: SendQuotePdfWhatsAppInput) {

    const { quoteVersionId, artifactId } = input

    const version = await prisma.quoteVersion.findUnique({
      where: {
        id: quoteVersionId
      },
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            chatThreadId: true,
          },

        },
        customer: {
          select: {
            name: true,
            lastname: true,
            phone: true,
            phoneWa: true
          }
        },
        artifacts: {
          where: { type: 'PDF' },
          select: {
            id: true,
            fileKey: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },

        },


      }
    })

    const chatThread = await prisma.chatThread.findUnique({
      where: {
        id: version.quote.chatThreadId
      },
      select: {
        lastInteraction: true
      }
    })

    if (!version) throw new Error('QuoteVersion no encontrada')
    if (!version.quote) throw new Error('Quote asociada no encontrada')
    const { quote } = version

    // 2) Teléfono del cliente (obligatorio para enviar)
    const toRaw = version.customer?.phoneWa || ''
    const to = toRaw.replace(/\D/g, '')
    if (!/^\d{8,15}$/.test(to)) throw new Error('Teléfono de cliente inválido para WhatsApp')

    // 3) Elegir artifact PDF (explícito u último por fecha)
    const selected =
      artifactId
        ? version.artifacts.find(a => a.id === artifactId)
        : version.artifacts[0]

    if (!selected) throw new Error('No hay PDF disponible para esta versión')

    // 4) Presigned URL corto (1h)
    const presignedUrl = await this.fileStorageService.generatePresignedUrl(
      selected.fileKey,
      60 * 60
    )

    // 5) Mensaje (texto libre, sin plantilla)
    const saludo = version.customer?.name ? `Hola ${version.customer.name},` : 'Hola,'
    const body = `${saludo} te comparto tu cotización #${quote.quoteNumber}.\nCualquier duda, quedo atento.`

    // 6) Idempotencia por (versión + artifact + destino)
    const idempotencyKey = `VER:${quoteVersionId}::ART:${selected.id}::TO:${to}`

    // Revisa si ya existe un OUTBOUND igual
    const existing = await prisma.message.findFirst({
      where: {
        to,
        direction: 'OUTBOUND',
        quoteVersionId,
        quoteArtifactId: selected.id,
        idempotencyKey,
      },
      select: { id: true, providerMessageId: true, status: true },
    })
    // if (existing) {

    //   return {
    //     messageId: existing.id,
    //     providerMessageSid: existing.providerMessageId ?? null,
    //     status: existing.status ?? 'queued',
    //     idempotent: true,
    //   }

    // }

    // 7) Registra el Message ligado al hilo y a la cotización
    const pre = await prisma.message.create({
      data: {
        chatThreadId: quote.chatThreadId!, // si no existe, esto lanzará error (decisión consciente)
        to,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        role: 'assistant',
        content: body,
        media: [
          {
            type: 'PDF',
            fileKey: selected.fileKey,
            mimeType: 'application/pdf',
            url: presignedUrl,
          },
        ],
        quoteId: quote.id,
        quoteVersionId: version.id,
        quoteArtifactId: selected.id,
        status: 'queued',
        idempotencyKey,
      },
      select: { id: true },
    })

    const { mode } = WhatsappWindow.decideSendModeFromLastInteraction(chatThread.lastInteraction)

    let sendResp: WhatsAppSendMediaResult;

    if (mode === 'DIRECT') {

      sendResp = await this.messageService.sendMediaMessage({
        to,
        body,
        mediaUrl: presignedUrl,
      })

    } else {
      console.log(to)

      sendResp = await this.whatsAppNotificationService
        .sendTemplateMessage(
          WhatsappTemplate.QUOTE_PDF_FOLLOWUP_FILE, 
          {
            to,
            version,
            quote:{
              ...quote,
              summary:''
            },
            presignedUrl
          }
        )

    }


    // 9) Actualiza el Message con provider/status
    await prisma.message.update({
      where: { id: pre.id },
      data: {
        provider: 'TWILIO',
        providerMessageId: sendResp.providerMessageSid,
        status: 'sent',
      },
    })

    await prisma.quoteVersion.update({
      where: {
        id: quoteVersionId
      },
      data: {
        pdfSentAt: new Date()
      }
    })

    // (Opcional) métrica en versión (p.ej. contador o timestamp)
    // await prisma.quoteVersion.update({
    //   where: { id: version.id },
    //   data: { summary: concat(summary, ' | PDF enviado …') }
    // })
    return {
      messageId: pre.id,
      providerMessageSid: sendResp.providerMessageSid,
      status: 'sent',
      idempotent: false,
    }



  }
}