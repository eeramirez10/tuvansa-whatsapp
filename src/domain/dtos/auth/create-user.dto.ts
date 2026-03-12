import { $Enums } from '@prisma/client';
import { Validators } from '../../../config/validators';


interface Options {
  name: string
  lastname: string
  email: string
  phone: string
  password: string
  role: $Enums.UserRole
  isActive: boolean
  branchId?: string;
  branchIds?: string[];
  username: string
  allowWhatsappAssistant?: boolean
}


export class CreateUserDto {

  public readonly name: string
  public readonly lastname: string
  public readonly username: string
  public readonly email: string
  public readonly phone: string
  public readonly password: string
  public readonly role: $Enums.UserRole
  public readonly isActive: boolean
  public readonly branchId?: string
  public readonly branchIds: string[]
  public readonly allowWhatsappAssistant: boolean



  constructor(options: Options) {
    this.name = options.name
    this.lastname = options.lastname
    this.email = options.email
    this.phone = options.phone
    this.password = options.password
    this.role = options.role
    this.isActive = options.isActive
    this.username = options.username
    this.branchIds = options.branchIds ?? (options.branchId ? [options.branchId] : [])
    this.branchId = this.branchIds[0]
    this.allowWhatsappAssistant = options.allowWhatsappAssistant ?? false
  }

  static execute(options: Options): [string?, CreateUserDto?] {

    const {
      name,
      lastname,
      email,
      phone = '',
      password,
      role = 'USER',
      isActive = true,
      branchId,
      branchIds,
      username,
      allowWhatsappAssistant = false
    } = options


    if ( !name ) return [ 'Missing name' ];
    if ( !lastname ) return [ 'Missing lastname' ];
    if ( !username ) return [ 'Missing username' ];
    if ( !email ) return [ 'Missing email' ];
    const normalizedBranchIds = Array.isArray(branchIds)
      ? [...new Set(branchIds.map((item) => `${item ?? ''}`.trim()).filter(Boolean))]
      : [];
    if (branchId && !normalizedBranchIds.includes(branchId)) {
      normalizedBranchIds.unshift(`${branchId}`.trim())
    }
    if ( normalizedBranchIds.length === 0 ) return [ 'Missing branchIds' ];
    if (role !== 'BRANCH_MANAGER' && normalizedBranchIds.length > 1) {
      return ['Solo BRANCH_MANAGER puede tener múltiples sucursales']
    }
    if ( !Validators.email.test( email ) ) return [ 'Email is not valid' ];
    if ( !password ) return ['Missing password'];
    if ( password.length < 6 ) return ['Password too short'];



    return [undefined, new CreateUserDto({
      name,
      lastname,
      email,
      phone,
      password,
      role,
      isActive,
      branchId: normalizedBranchIds[0],
      branchIds: normalizedBranchIds,
      username,
      allowWhatsappAssistant: Boolean(allowWhatsappAssistant)
    })]
  }
}
