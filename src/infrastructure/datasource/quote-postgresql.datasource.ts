import { PrismaClient } from "@prisma/client";
import { QuoteDatasource } from "../../domain/datasource/quote.datasource";
import { AddQuoteItemsDto } from "../../domain/dtos/add-quote-items.dto";
import { CreateQuoteDto } from "../../domain/dtos/create-quote.dto";
import { QuoteItemEntity } from "../../domain/entities/quote-item.entity";
import { QuoteEntity } from "../../domain/entities/quote.entity";
import { UpdateQuoteItemDto } from "../../domain/dtos/quotes/update-quote-item.dto";
import { GetQuotesDto } from "../../domain/dtos/quotes/get-quotes.dto";
import { UpdateQuoteDto } from "../../domain/dtos/quotes/update-quote.dto";
import { PaginationResult } from "../../domain/entities/pagination-result";
import dayjs from "dayjs";


const prismaClient = new PrismaClient()


export class QuotePostgresqlDatasource extends QuoteDatasource {



  async updateQuote(id: string, updateQuoteDto: UpdateQuoteDto): Promise<QuoteEntity> {
    return await prismaClient.quote.update({
      where: { id },
      data: updateQuoteDto
    })
  }







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
          chatThread: {
            include: {
              messages: true
            }
          }
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en Quote revisar logs')

    }

  }

  async getQuotes(getQuotesDto: GetQuotesDto): Promise<PaginationResult<QuoteEntity>> {

    const page = Math.max(1, Number(getQuotesDto.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(getQuotesDto.pageSize ?? 20)));

    const where = this.buildDateRange(getQuotesDto.startDate, getQuotesDto.endDate);

    const skip = (page - 1) * pageSize;
    const take = pageSize;


    try {

      const [total, items] = await Promise.all([
        prismaClient.quote.count({ where }),
        prismaClient.quote.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: {
            customer: true,
            items: true,
            // OJO: si messages es grande, considera limitar campos o contar:
            chatThread: {
              include: {
                messages: true
              }
            }
          }
        })

      ])

      return {
        items,
        total,
        page,
        pageSize
      }

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en Quote revisar logs')

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
    // console.log({ findQuoteName })

    if (!findQuoteName) {

      const res = await prismaClient.counter.create({
        data: {
          name: 'quote',
          value: 0
        }
      })
      // console.log({ res })

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

    const { customerId, fileKey, threadId } = createQuoteDto


    try {

      const quoteNumber = await this.getNextQuoteNumber()

      return await prismaClient.quote.create({
        data: {
          quoteNumber,
          customerId,
          fileKey,
          chatThreadId: threadId
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

  private buildDateRange(startDate?: string, endDate?: string) {
    if (!startDate || !endDate) return undefined;
    // Tus fechas vienen "DD-MM-YYYY"
    const start = dayjs(startDate, "DD-MM-YYYY", true).startOf("day");
    const end = dayjs(endDate, "DD-MM-YYYY", true).endOf("day");
    if (!start.isValid() || !end.isValid()) return undefined;
    // Prisma: usa gte / lte para incluir el día completo
    return { createdAt: { gte: start.toDate(), lte: end.toDate() } };
  }






}