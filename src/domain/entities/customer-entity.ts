import { Customer } from "@prisma/client";



interface Options {
  id: string
  name: string
  lastname: string
  email: string
  phone: string
  location: string
  createdAt: Date
}



export class CustomerEntity implements Customer {
  readonly id: string
  readonly name: string
  readonly lastname: string
  readonly email: string
  readonly phone: string
  readonly location: string
  readonly createdAt: Date


  constructor(options: Options) {
    this.id = options.id
    this.name = options.name
    this.lastname = options.lastname
    this.email = options.email
    this.phone = options.phone
    this.location = options.location
    this.createdAt = options.createdAt

  }
}