import { PrismaClient } from "@prisma/client";
import { CustomerDatasource } from "../../domain/datasource/customer.datasource";
import { CreateCustomerDto } from "../../domain/dtos/create-customer.dto";
import { CustomerEntity } from "../../domain/entities/customer-entity";
import { UpdateCustomerDto } from "../../domain/dtos/update-customer.dto";


const prismaClient = new PrismaClient()

export class CustomerPostgresqlDatasource extends CustomerDatasource {



  async findByWhatsappPhone(phoneWa: string): Promise<CustomerEntity> {
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

    const { id, ...rest } = updateCustometDto

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