import { UserRole } from "@prisma/client"
import { BranchUserResponse } from "./branch-user-response.dto";


interface Option {
  id: string
  name: string
  lastname: string
  username: string;
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
  allowWhatsappAssistant: boolean
  createdAt: Date
  updatedAt: Date
  branch: BranchUserResponse | null;
  branches: BranchUserResponse[];

}

export class UsersResponseDTO {

  id: string
  name: string
  lastname: string
  username: string;
  email: string
  phone: string | null
  role: UserRole
  isActive: boolean
  allowWhatsappAssistant: boolean
  createdAt: Date
  updatedAt: Date
  branch: BranchUserResponse | null;
  branches: BranchUserResponse[];

  constructor(option: Option) {

    this.id = option.id
    this.name = option.name
    this.lastname = option.lastname
    this.username = option.username
    this.email = option.email
    this.phone = option.phone
    this.role = option.role
    this.isActive = option.isActive
    this.allowWhatsappAssistant = option.allowWhatsappAssistant
    this.createdAt = option.createdAt
    this.updatedAt = option.updatedAt
    this.branch = option.branch
    this.branches = option.branches
  }


}
