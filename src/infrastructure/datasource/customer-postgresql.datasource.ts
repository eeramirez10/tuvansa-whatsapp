import { Prisma, PrismaClient } from "@prisma/client";
import { CustomerDatasource } from "../../domain/datasource/customer.datasource";
import { CreateCustomerDto } from "../../domain/dtos/create-customer.dto";
import { CustomerEntity } from "../../domain/entities/customer-entity";
import { UpdateCustomerDto } from "../../domain/dtos/update-customer.dto";
import {
  CustomerDirectoryDetail,
  CustomerDirectoryPage,
  CustomerDirectoryScope,
  ListCustomersDirectoryDto
} from '../../domain/dtos/customers/customer-directory.dto';


const prismaClient = new PrismaClient()

export class CustomerPostgresqlDatasource extends CustomerDatasource {



  async updateCustomerByWhatsappNumber(whatsappNumber: string, updateCustometDto: UpdateCustomerDto): Promise<CustomerEntity> {


    return prismaClient.customer.update({
      where: {
        phoneWa: whatsappNumber
      },
      data: {
        ...updateCustometDto
      }
    })
  }



  async findByWhatsappPhone(phoneWa: string): Promise<CustomerEntity | null> {
    return await prismaClient.customer.findUnique({
      where: {
        phoneWa
      }
    });

  }



  async getCustomers(): Promise<CustomerEntity[]> {
    return await prismaClient.customer.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        quotes: true
      }
    })
  }

  async getDirectory(
    dto: ListCustomersDirectoryDto,
    scope: CustomerDirectoryScope
  ): Promise<CustomerDirectoryPage> {
    const quoteWhere = this.buildVisibleQuoteWhere(scope)
    const isScoped = this.isScoped(scope)
    const where: Prisma.CustomerWhereInput = {
      ...(dto.search ? {
        OR: [
          { name: { contains: dto.search, mode: 'insensitive' } },
          { lastname: { contains: dto.search, mode: 'insensitive' } },
          { email: { contains: dto.search, mode: 'insensitive' } },
          { phone: { contains: dto.search } },
          { company: { contains: dto.search, mode: 'insensitive' } }
        ]
      } : {}),
      ...(isScoped ? { quotes: { some: quoteWhere } } : {})
    }

    const [total, customers] = await prismaClient.$transaction([
      prismaClient.customer.count({ where }),
      prismaClient.customer.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        select: {
          id: true,
          name: true,
          lastname: true,
          email: true,
          phone: true,
          location: true,
          company: true,
          createdAt: true,
          _count: {
            select: {
              quotes: { where: quoteWhere }
            }
          },
          quotes: {
            where: quoteWhere,
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true }
          }
        }
      })
    ])

    return {
      items: customers.map((customer) => ({
        id: customer.id,
        name: customer.name,
        lastname: customer.lastname,
        email: customer.email,
        phone: customer.phone,
        location: customer.location,
        company: customer.company,
        createdAt: customer.createdAt,
        quoteCount: customer._count.quotes,
        lastQuoteAt: customer.quotes[0]?.createdAt ?? null
      })),
      total,
      page: dto.page,
      pageSize: dto.pageSize
    }
  }

  async getDirectoryById(
    customerId: string,
    scope: CustomerDirectoryScope
  ): Promise<CustomerDirectoryDetail | null> {
    const quoteWhere = this.buildVisibleQuoteWhere(scope)
    const isScoped = this.isScoped(scope)

    return prismaClient.customer.findFirst({
      where: {
        id: customerId,
        ...(isScoped ? { quotes: { some: quoteWhere } } : {})
      },
      select: {
        id: true,
        name: true,
        lastname: true,
        email: true,
        phone: true,
        location: true,
        company: true,
        createdAt: true,
        quotes: {
          where: quoteWhere,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            quoteNumber: true,
            createdAt: true,
            status: true,
            workflowStatus: true,
            branchId: true,
            branch: {
              select: {
                id: true,
                name: true
              }
            },
            assignedSeller: {
              select: {
                id: true,
                name: true,
                lastname: true
              }
            }
          }
        }
      }
    })
  }

  private buildVisibleQuoteWhere(scope: CustomerDirectoryScope): Prisma.QuoteWhereInput {
    return {
      ...(scope.assignedSellerId !== undefined
        ? { assignedSellerId: scope.assignedSellerId }
        : {}),
      ...(scope.branchIds !== undefined
        ? { branchId: { in: scope.branchIds } }
        : {})
    }
  }

  private isScoped(scope: CustomerDirectoryScope): boolean {
    return scope.assignedSellerId !== undefined || scope.branchIds !== undefined
  }



  async getCustomerByQuoteNumber(quoteNumber: number): Promise<CustomerEntity | null> {

    return await prismaClient.customer.findFirst({
      where: {
        quotes: {
          some: {
            quoteNumber
          }
        }
      },
      include: {
        quotes: {
          include: {
            items: true
          }
        }
      }
    })
  }
  getById(customerId: string): Promise<CustomerEntity | null> {

    return prismaClient.customer.findFirst({
      where: {
        id: customerId
      },
      include: {
        quotes: {
          include: {
            customer: true
          }
        },
        chatThreads: true
      }
    })
  }


  async updateCustomer(updateCustometDto: UpdateCustomerDto): Promise<CustomerEntity> {

    const { ...rest } = updateCustometDto

    return await prismaClient.customer.update({
      where: {
        phone: rest.phone,
        name: rest.name
      },
      data: {
        ...rest
      }
    })
  }


  async findByPhone(phoneNumber: string): Promise<CustomerEntity | null> {
    return await prismaClient.customer.findFirst({
      where: {
        phone: phoneNumber
      }
    })
  }


  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerEntity> {
    const { location = '', ...rest } = createCustomerDto

    try {
      return await prismaClient.customer.create({
        data: {
          ...rest,
          location
        }
      })

    } catch (error) {

      console.log(error)

      throw Error('Hubo un error en Customer revisar logs')
    }

  }

}
