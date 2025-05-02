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
  branchId: string;
  username: string
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
  public readonly branchId: string



  constructor(options: Options) {
    this.name = options.name
    this.lastname = options.lastname
    this.email = options.email
    this.phone = options.phone
    this.password = options.password
    this.role = options.role
    this.isActive = options.isActive
    this.username = options.username
    this.branchId = options.branchId
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
      username
    } = options


    if ( !name ) return [ 'Missing name' ];
    if ( !lastname ) return [ 'Missing lastname' ];
    if ( !username ) return [ 'Missing username' ];
    if ( !email ) return [ 'Missing email' ];
    if ( !branchId ) return [ 'Missing branchId' ];
    if ( !Validators.email.test( email ) ) return [ 'Email is not valid' ];
    if ( !password ) return ['Missing password'];
    if ( password.length < 6 ) return ['Password too short'];



    return [undefined, new CreateUserDto({ name, lastname, email, phone, password, role, isActive, branchId, username})]
  }
}