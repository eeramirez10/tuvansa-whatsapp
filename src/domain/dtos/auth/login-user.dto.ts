import { $Enums } from '@prisma/client';
import { Validators } from '../../../config/validators';


interface ExecuteOptions {
  name: string
  lastname: string
  email: string
  phone: string
  password: string
  role: $Enums.UserRole
  isActive: boolean
}



export class LoginUserDto {

  constructor(public readonly email: string, public readonly password: string) { }


  static execute(options: ExecuteOptions): [string?, LoginUserDto?] {

    console.log(options)

    const { email, password } = options

    if (!email) return ['El email es requerido']
    if (!Validators.email.test(email)) return ['No es un correo valido ']
    if (!password) return ['La contraseña es requerida']
    if (password.length < 5) ['La contraseña es muy corta']


    return [undefined, new LoginUserDto(email, password)]
  }
}