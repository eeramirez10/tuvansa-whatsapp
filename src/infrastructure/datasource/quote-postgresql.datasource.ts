import { PrismaClient } from "@prisma/client";
import { QuoteDatasource } from "../../domain/datasource/quote.datasource";
import { AddQuoteItemsDto } from "../../domain/dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../../domain/dtos/create-quote.dto";
import { QuoteItemEntity } from "../../domain/entities/quote-item.entity";
import { QuoteEntity } from "../../domain/entities/quote.entity";
import { UpdateQuoteItemDto } from "../../domain/dtos/quotes/update-quote-item.dto";


const prismaClient = new PrismaClient()


export class QuotePostgresqlDatasource extends QuoteDatasource {



  async updateQuoteItem(id: string, updateQuoteItemDto: UpdateQuoteItemDto): Promise<QuoteItemEntity> {
    return await prismaClient.quoteItem.update({
      where: { id },
      data: updateQuoteItemDto
    })
  }


  async getQuote(id: string): Promise<QuoteEntity | null> {

    try {

      return prismaClient.quote.findFirst({
        where: {
          id
        },
        include: {
          customer: true,
          items: true,
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en Quote revisar logs')

    } finally {
      prismaClient.$disconnect()
    }

  }

  async getQuotes(): Promise<QuoteEntity[]> {
    try {

      return await prismaClient.quote.findMany({
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          customer: true,
          items: true,
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en Quote revisar logs')

    } finally {
      prismaClient.$disconnect()
    }
  }



  async findByQuoteNumber({ quoteNumber }: { quoteNumber: number; }): Promise<QuoteEntity | null> {

    try {
      return await prismaClient.quote.findFirst({
        where: { quoteNumber },
        include: {
          customer: true,
          items: true
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en Quote revisar logs')

    } finally {
      prismaClient.$disconnect()
    }
  }


  async getNextQuoteNumber(): Promise<number> {

    const findQuoteName = await prismaClient.counter.findFirst({ where: { name: 'quote' } })
    console.log({ findQuoteName })

    if (!findQuoteName) {

      const res = await prismaClient.counter.create({
        data: {
          name: 'quote',
          value: 0
        }
      })
      console.log({ res })

    }

    const [res] = await prismaClient.$queryRaw<{ value: number }[]>`
    UPDATE "Counter"
    SET "value" = "value" + 1
    WHERE "name" = 'quote'
    RETURNING "value"
  `;
    if (!res) throw new Error('No existe un contador para "quote"');

    return res.value;
  }


  async createQuote(createQuoteDto: CreateQuoteDto): Promise<QuoteEntity> {

    const { customerId, fileKey } = createQuoteDto


    try {

      const quoteNumber = await this.getNextQuoteNumber()

      return await prismaClient.quote.create({
        data: {
          quoteNumber,
          customerId,
          fileKey
        },
        include: {
          customer: true,
          items: true
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en Quote revisar logs')

    } finally {
      prismaClient.$disconnect()
    }


  }


  async addQuoteItems(addQuoteItems: AddQuoteItemsDto): Promise<QuoteItemEntity> {

    try {

      return await prismaClient.quoteItem.create({
        data: {
          ...addQuoteItems
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en Quote revisar logs')

    } finally {
      prismaClient.$disconnect()
    }

  }








}