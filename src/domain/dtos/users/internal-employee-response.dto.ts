
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  SUPPORT = 'SUPPORT',
  VIEWER = 'VIEWER'
}



interface InternalEmployeeUserOption {
  id: string
  name: string
  role: UserRole
  branchId: string | null
  branchIds: string[]
  phone: string | null
  allowWhatsappAssistant: boolean
}



export class InternalEmployeeResponseDto {

  public readonly id: string
  public readonly name: string
  public readonly role: UserRole
  public readonly branchId: string | null
  public readonly branchIds: string[]
  public readonly phone: string | null
  public readonly allowWhatsappAssistant: boolean

  constructor(options: InternalEmployeeUserOption) {
    this.id = options.id
    this.name = options.name
    this.role = options.role
    this.branchId = options.branchId
    this.branchIds = options.branchIds
    this.phone = options.phone
    this.allowWhatsappAssistant = options.allowWhatsappAssistant
  }


}
