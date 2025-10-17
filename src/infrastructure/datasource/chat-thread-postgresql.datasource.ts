import { PrismaClient } from "@prisma/client";
import { ChatThreadDatasource } from "../../domain/datasource/chat-thread.datasource";
import { AddMessageDto } from "../../domain/dtos/add-message.dto";
import { CreateThreadDto } from "../../domain/dtos/create-thread.dto";
import { ChatThreadEntity } from "../../domain/entities/chat-thread.entity";
import { MessageEntity } from "../../domain/entities/message.entity";
import { GetThreadsDto } from "../../domain/dtos/threads/get-threads.dto";
import { GetMessagesDto } from "../../domain/dtos/threads/get-messages.dto";


const prismaClient = new PrismaClient()


export class ChatThreadPostgresqlDatasource extends ChatThreadDatasource {


  async getMessagesByThread(threadId: string, getMessageDto: GetMessagesDto): Promise<ChatThreadEntity | null> {

    const { page, pageSize } = getMessageDto

    const take = pageSize;
    const skip = (page - 1) * pageSize

    return await prismaClient.chatThread.findFirst({
      where: {
        id: threadId
      },
      include: {
        customer: true,
        messages: {
          take,
          skip,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
  }




  async getThreads(getThreadsDto: GetThreadsDto): Promise<ChatThreadEntity[]> {

    const { page, pageSize } = getThreadsDto

    const take = pageSize;
    const skip = (page - 1) * pageSize

    return prismaClient.chatThread.findMany({
      take,
      skip,
      orderBy: {

        lastInteraction: {
          sort: 'desc',
          nulls: 'last'
        }
      },
      include: {
        customer: true,

        messages: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })
  }


  async addCustomer(openAiThreadId: string, customerId: string): Promise<ChatThreadEntity> {


    const customer = await prismaClient.customer.findUnique({ where: { id: customerId } })

    if (!customer) {
      console.error('Cliente no encontrado:', customerId);
      throw new Error(`Cliente no existe con el id: ${customerId}`);
    }



    return await prismaClient.chatThread.update({
      where: {
        openAiThreadId
      },
      data: {
        customerId: customerId
      }
    })
  }

  async getByThreadId(threadId: string): Promise<ChatThreadEntity | null> {

    try {

      return await prismaClient.chatThread.findFirst({
        where: {
          openAiThreadId: threadId
        },
        include: {
          customer: true,
          messages: true
        }
      })


    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en ChatThread revisar logs')

    } finally {
      prismaClient.$disconnect()
    }




  }

  async getThreadByPhone({ phone }: { phone: string; }): Promise<ChatThreadEntity | null> {

    try {

      return await prismaClient.chatThread.findFirst({
        where: {
          clientPhoneNumber: phone
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en ChatThread revisar logs')

    } finally {
      prismaClient.$disconnect()
    }

  }


  async createThread(createThreadOptions: CreateThreadDto): Promise<ChatThreadEntity> {

    try {

      return await prismaClient.chatThread.create({
        data: {
          openAiThreadId: createThreadOptions.threadId,
          clientPhoneNumber: createThreadOptions.clientPhoneNumber
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en ChatThread revisar logs')

    } finally {
      prismaClient.$disconnect()
    }


  }


  async addMessage(addMessageOptions: AddMessageDto): Promise<MessageEntity> {

    try {

      await this.updateLastInteraction(addMessageOptions.chatThreadId)

      return await prismaClient.message.create({
        data: {
          role: addMessageOptions.role,
          content: addMessageOptions.content,
          chatThreadId: addMessageOptions.chatThreadId
        }
      })



    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en ChatThread revisar logs')

    } finally {
      prismaClient.$disconnect()
    }

  }

  private async updateLastInteraction(threadId: string) {

    await prismaClient.chatThread.update({
      where: {
        id: threadId
      },
      data: {
        lastInteraction: new Date()
      }
    })
  }



}