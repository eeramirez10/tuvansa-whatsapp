import { EnsureChatThreadForPhoneUseCase } from "./ensure-chat-thread-for-phone.use-case";
import { LanguageModelService } from '../../../domain/services/language-model.service';
import { ChatThreadRepository } from '../../../domain/repositories/chat-thread.repository';
import { PrismaClient } from "@prisma/client";
import { UserQuestionCoreUseCase } from "./user-question-core.use-case";

const prisma = new PrismaClient

export class UserQuestionQueueProcessor {

  constructor(

    private readonly openAiService: LanguageModelService,
    private readonly chatThreadRepository: ChatThreadRepository,
    private readonly userQuestionCoreUseCase: UserQuestionCoreUseCase,
  ) { }


  async execute(phoneWa: string) {

    const { chatThread, threadId } = await
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
              return `He adjuntado un archivo: ${p.fileKey}\nNombre original del archivo: ${displayFilename}`;
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
          await this.userQuestionCoreUseCase.execute({
            phoneWa,
            question: combinedQuestion,
            threadId,
            chatThreadId: chatThread.id
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
