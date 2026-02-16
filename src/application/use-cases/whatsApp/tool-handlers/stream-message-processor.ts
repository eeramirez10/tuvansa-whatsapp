
import { PrismaClient } from '@prisma/client';
import { MessageService } from '../../../../domain/services/message.service';
import { ProductStreamParser } from '../../../../infrastructure/services/product-stream-parser.service';

const prisma = new PrismaClient();

/**
 * Processes OpenAI streaming responses and sends WhatsApp messages.
 * Handles product line parsing and formatting, and sends messages line-by-line.
 */
export class StreamMessageProcessor {
  private parser: ProductStreamParser;

  constructor(
    private messageService: MessageService,
    private chatThreadId: string,
    private phoneWa: string
  ) {
    this.parser = new ProductStreamParser();
  }

  /**
   * Process the entire OpenAI stream and send WhatsApp messages in real-time
   */
  async processStream(stream: AsyncIterable<any>): Promise<void> {
    let buffer = '';
    let nonProductBuffer = '';
    let nonProductUseNewlines = false;
    let lastLineWasBullet = false;

    for await (const event of stream) {
      if (event.event !== 'thread.message.delta') continue;

      const parts = (event.data as any).delta.content as Array<{ text: { value: string } }>;

      for (const part of parts) {
        buffer += part.text.value;

        let idx: number;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const rawLine = buffer.slice(0, idx);
          const line = rawLine.trim();

          // Detectar líneas vacías ANTES de filtrarlas
          if (rawLine.trim() === '') {
            nonProductUseNewlines = true;
            lastLineWasBullet = false;
          }

          if (line) {
            const { isProductLine, completedIndex } = this.parser.processLine(line);

            // Si NO es línea de producto → la mandas tal cual
            if (!isProductLine) {
              const isBullet = /^([•*-]|\d+[).])/.test(line);

              if (isBullet) {
                nonProductUseNewlines = true;
                // Si la línea anterior también era bullet, agregar línea en blanco
                if (lastLineWasBullet) {
                  nonProductBuffer += '\n';
                }
                lastLineWasBullet = true;
              } else {
                lastLineWasBullet = false;
              }

              const separator = nonProductBuffer
                ? (nonProductUseNewlines ? '\n' : ' ')
                : '';
              nonProductBuffer = `${nonProductBuffer}${separator}${line}`;
            }

            if (completedIndex != null) {
              if (nonProductBuffer) {
                await this.sendStreamedMessage(nonProductBuffer);
                nonProductBuffer = '';
                nonProductUseNewlines = false;
              }
              const bloque = this.parser.formatProduct(completedIndex);
              if (bloque) {
                await this.sendStreamedMessage(bloque);
                this.parser.markSent(completedIndex);
              }
            }
          }

          buffer = buffer.slice(idx + 1);
        }
      }
    }

    // Process remaining buffer
    const remainder = buffer.trim();
    console.log('[StreamMessageProcessor] Remainder:', { remainder });
    
    if (remainder) {
      const trimmedRemainder = remainder.trim();
      const shouldPreserveLineBreaks =
        trimmedRemainder === '' ||
        /^([•*-]|\d+[).])/.test(trimmedRemainder);
      if (shouldPreserveLineBreaks) {
        nonProductUseNewlines = true;
      }
      const separator = nonProductBuffer
        ? (nonProductUseNewlines ? '\n' : ' ')
        : '';
      nonProductBuffer = `${nonProductBuffer}${separator}${remainder}`;
    }

    // Flush remaining non-product buffer
    if (nonProductBuffer) {
      await this.sendStreamedMessage(nonProductBuffer);
    }
  }

  /**
   * Send a single message via WhatsApp and persist to database
   */
  private async sendStreamedMessage(content: string): Promise<void> {
    await this.messageService.createWhatsAppMessage({
      to: this.phoneWa,
      body: content,
    });

    await prisma.message.create({
      data: {
        role: 'assistant',
        content,
        chatThreadId: this.chatThreadId,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        to: this.phoneWa,
      },
    });
  }
}
