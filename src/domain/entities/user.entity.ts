import { $Enums, User } from "@prisma/client"
import { QuoteHistoryEntity } from './quote-history.entity';


interface UserEntityOptions {
  name: string
  id: string
  lastname: string
  email: string
  phone: string
  password: string
  role: $Enums.UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  username: string;


}

export class UserEntity implements User {

  name: string
  id: string
  lastname: string
  email: string
  phone: string | null
  password: string
  role: $Enums.UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  quoteHistories?: QuoteHistoryEntity[] 
  branchId: string;
  username: string;


  constructor(options: UserEntityOptions) {

    this.name = options.name
    this.id = options.id
    this.lastname = options.lastname
    this.email = options.email
    this.phone = options.phone
    // this.password = options.password
    this.role = options.role
    this.isActive = options.isActive
    this.createdAt = options.createdAt
    this.updatedAt = options.updatedAt
    this.username = options.username

  }
  
  



}


