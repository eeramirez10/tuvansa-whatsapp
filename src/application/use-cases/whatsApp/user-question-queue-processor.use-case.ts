import { EnsureChatThreadForPhoneUseCase } from "./ensure-chat-thread-for-phone.use-case";
import { LanguageModelService } from '../../../domain/services/language-model.service';
import { ChatThreadRepository } from '../../../domain/repositories/chat-thread.repository';
import { PrismaClient } from "@prisma/client";
import { UserQuestionCoreUseCase } from "./user-question-core.use-case";
import { CustomerRepository } from '../../../domain/repositories/customer.repository';
import { ResolveCustomerContextUseCase } from './resolve-customer-context.use-case';

const prisma = new PrismaClient
const FILE_REPLACEMENT_CANDIDATE_BODY = '__FILE_REPLACEMENT_CANDIDATE__'

export class UserQuestionQueueProcessor {

  constructor(

    private readonly openAiService: LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly userQuestionCoreUseCase: UserQuestionCoreUseCase,
  ) { }


  async execute(phoneWa: string) {

    const { chatThread, conversationId } = await
      new EnsureChatThreadForPhoneUseCase
        (
          this.openAiService,
          this.chatThreadRepository
        )
        .execute(phoneWa)


    if (chatThread.isProcessing) return;

    await this.chatThreadRepository.setProcessing(chatThread.id, true)

    try {

      while (true) {

        const pendings = await prisma.pendingMessage.findMany({
          where: {
            chatThreadId: chatThread.id,
            status: 'PENDING'
          },
          orderBy: {
            createdAt: 'asc'
          }
        })



        if (pendings.length === 0) break;

        const ids = pendings.map(p => p.id);

        await prisma.pendingMessage.updateMany({
          where: {
            id: { in: ids }
          },
          data: {
            status: 'PROCESSING'
          }
        })

        let firstFileIncluded = false;
        const pendingFile = pendings.find((pending) => pending.fileKey) ?? null;

        const combinedQuestion = pendings
          .map((p) => {
            if (p.fileKey) {
              if (firstFileIncluded) {
                console.warn('[UserQuestionQueueProcessor] Ignoring extra file for current batch:', p.fileKey);
                return '';
              }

              const pendingItem = p as any;
              const originalFilename = (pendingItem.originalFilename as string | null | undefined) ?? null;
              const displayFilename = originalFilename?.trim() ? originalFilename : p.fileKey;

              firstFileIncluded = true;
              const body = p.body?.trim() ? `${p.body.trim()}\n` : '';
              return `${body}Archivo confirmado por el cliente: ${p.fileKey}\nNombre original del archivo: ${displayFilename}`;
            }
            return p.body?.trim() || '';
          })
          .filter((p) => p.length > 0)
          .join('\n')

        console.log({ combinedQuestion })

        if (!combinedQuestion) {
          console.warn('[UserQuestionQueueProcessor] Empty combinedQuestion; marking pending batch as ERROR');
          await prisma.pendingMessage.updateMany({
            where: {
              id: { in: ids }
            },
            data: {
              status: 'ERROR'
            }
          })
          continue;
        }

        try {
          const replacementFileKeys = pendingFile?.fileKey
            ? []
            : (await prisma.pendingMessage.findMany({
              where: {
                chatThreadId: chatThread.id,
                status: 'ERROR',
                body: FILE_REPLACEMENT_CANDIDATE_BODY,
                fileKey: { not: null }
              },
              select: { fileKey: true }
            })).map((candidate) => candidate.fileKey).filter((fileKey): fileKey is string => !!fileKey)
          const persistedFile = pendingFile?.fileKey
            ? pendingFile
            : await prisma.temporaryFile.findFirst({
              where: {
                chatThreadId: chatThread.id,
                ...(replacementFileKeys.length > 0 ? {
                  fileKey: { notIn: replacementFileKeys }
                } : {})
              },
              orderBy: { createdAt: 'desc' },
              select: {
                fileKey: true,
                originalFilename: true
              }
            })
          const customerContext = await new ResolveCustomerContextUseCase(
            this.customerRepository
          ).execute(phoneWa)

          await this.userQuestionCoreUseCase.execute({
            phoneWa,
            question: combinedQuestion,
            conversationId,
            chatThreadId: chatThread.id,
            context: {
              customer: customerContext,
              attachment: persistedFile?.fileKey ? {
                fileKey: persistedFile.fileKey,
                originalFilename: persistedFile.originalFilename?.trim() || persistedFile.fileKey,
                confirmed: true
              } : null
            }
          })

          await prisma.pendingMessage.updateMany({
            where: { id: { in: ids } },
            data: { status: 'DONE' },
          });
        } catch (error) {
          console.error('[UserQuestionCoreUseCase error]', error);

          await prisma.pendingMessage.updateMany({
            where: { id: { in: ids } },
            data: { status: 'ERROR' },
          });

          break;
        }
      }

    } finally {
      await this.chatThreadRepository.setProcessing(chatThread.id, false);
    }


  }

}
