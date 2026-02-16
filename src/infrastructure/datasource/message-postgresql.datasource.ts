
import { PrismaClient } from "@prisma/client";
import { BuildIdempotencyKeyOptions, MessageDatasource, OutboundMessageCreate } from "../../domain/datasource/message.datasource";
import { MessageEntity } from "../../domain/entities/message.entity";

import crypto from 'crypto'
import { CreateAssistantMessageRequest } from "../../domain/dtos/messages/create-assistant-message-request.dto";
import { CreateUserMessageRequestDTO } from "../../domain/dtos/messages/create-user-message-request.dto";



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

  markSent(id: string, providerMessageSid: string): Promise<MessageEntity> {
    throw new Error("Method not implemented.");
  }
  updateStatusByProviderSid(providerMessageSid: string, status: string, extra?: any): Promise<MessageEntity> {
    throw new Error("Method not implemented.");
  }


  async createUserMessage(request: CreateUserMessageRequestDTO): Promise<void> {

    const { content, chatThreadId, from } = request

    await prismaClient.message.create({
      data: {
        role: "user",
        content,
        chatThreadId,
        channel: 'WHATSAPP',
        direction: 'INBOUND',
        from,

      }
    })
  }


  async createAssistantMessage(request: CreateAssistantMessageRequest): Promise<void> {

    const { content, chatThreadId, to } = request

    await prismaClient.message.create({
      data: {
        role: "assistant",
        content,
        chatThreadId,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        to
      }
    })
  }




}