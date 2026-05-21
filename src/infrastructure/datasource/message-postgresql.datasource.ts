
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
    return prismaClient.message.update({
      where: { id },
      data: {
        provider: 'TWILIO',
        providerMessageId: providerMessageSid,
        status: 'SENT',
        errorCode: null
      }
    }) as unknown as Promise<MessageEntity>
  }
  updateStatusByProviderSid(providerMessageSid: string, status: string, extra?: any): Promise<MessageEntity> {
    return (async () => {
      const found = await prismaClient.message.findFirst({
        where: { providerMessageId: providerMessageSid },
        orderBy: { createdAt: 'desc' }
      })

      if (!found?.id) {
        throw new Error(`Message not found for provider sid: ${providerMessageSid}`)
      }

      const normalizedStatus = `${status ?? 'UNKNOWN'}`.trim().toUpperCase()
      const normalizedErrorCode = extra?.errorCode != null
        ? `${extra.errorCode}`
        : null

      const updated = await prismaClient.message.update({
        where: { id: found.id },
        data: {
          status: normalizedStatus,
          errorCode: normalizedErrorCode
        }
      })

      return updated as unknown as MessageEntity
    })()
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

    const { content, chatThreadId, to, providerMessageId, status, errorCode } = request

    await prismaClient.message.create({
      data: {
        role: "assistant",
        content,
        chatThreadId,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        to,
        provider: 'TWILIO',
        providerMessageId: providerMessageId ?? null,
        status: status ?? null,
        errorCode: errorCode ?? null
      }
    })
  }




}
