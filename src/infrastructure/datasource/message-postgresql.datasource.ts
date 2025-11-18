
import { PrismaClient } from "@prisma/client";
import { BuildIdempotencyKeyOptions, MessageDatasource, OutboundMessageCreate } from "../../domain/datasource/message.datasource";
import { MessageEntity } from "../../domain/entities/message.entity";

import crypto from 'crypto'



const prismaClient = new PrismaClient()

export class MessagePostgresqlDatasource implements MessageDatasource {



  buildIdempotencyKey(input: BuildIdempotencyKeyOptions): string {
    const raw = `${input.to}|${input.quoteVersionId}|${input.artifactId}|${input.fileKey}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  async findByIdempotency(idem: string): Promise<MessageEntity> {
    return await prismaClient.message.findFirst({
      where: {
        idempotencyKey: idem,
        direction: 'OUTBOUND',
        channel: 'WHATSAPP'
      }
    })
  }
  createQueued(data: OutboundMessageCreate): Promise<MessageEntity> {
    return prismaClient.message.create({
      data: {
        quoteId: data.quoteId,
        quoteVersionId: data.quoteVersionId,
        quoteArtifactId: data.artifactId,
        to: data.to,
        from: data.from,
        channel: data.channel,
        direction: data.direction,
        status: "QUEUED",
        role: "assistant",
        content: data.body ?? "",
        media: data.media as unknown as any,
        idempotencyKey: data.idempotencyKey,
        chatThreadId: data.chatThreadId
      },
    });
  }
  markSent(id: string, providerMessageSid: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  updateStatusByProviderSid(providerMessageSid: string, status: string, extra?: any): Promise<void> {
    throw new Error("Method not implemented.");
  }

}