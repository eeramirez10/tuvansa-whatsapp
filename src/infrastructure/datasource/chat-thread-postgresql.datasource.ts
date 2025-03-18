import { Prisma, PrismaClient } from "@prisma/client";
import { ChatThreadDatasource } from "../../domain/datasource/chat-thread.datasource";
import { AddMessageDto } from "../../domain/dtos/add-message.dto";
import { CreateThreadDto } from "../../domain/dtos/create-thread.dto";
import { ChatThreadEntity } from "../../domain/entities/chat-thread.entity";
import { MessageEntity } from "../../domain/entities/message.entity";





const prismaClient = new PrismaClient()


export class ChatThreadPostgresqlDatasource extends ChatThreadDatasource {


  async addCustomer(threadId: string, customerId: string): Promise<ChatThreadEntity> {

    console.log('[ChatThread addCustomer]', { threadId, customerId })

    return await prismaClient.chatThread.update({
      where: {
        id: threadId
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

}