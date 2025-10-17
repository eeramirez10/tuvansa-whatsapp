import { NextFunction, Response, Request } from 'express';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { LoginUserDto } from '../../domain/dtos/auth/login-user.dto';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user.use-case';
import { CustomError } from '../../domain/errors/custom-error';
import { CreateUserDto } from '../../domain/dtos/auth/create-user.dto';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user.use-case';
import { RenewTokenUseCase } from '../../application/use-cases/auth/renew-token.use-case';
import { CheckFieldDto } from '../../domain/dtos/auth/check-field.dto';
import { CheckFieldUseCase } from '../../application/use-cases/auth/check-field.use-case';


export class AuthController {

  constructor(private readonly authRepository: AuthRepository) { }


  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {

      return res.status(error.statusCode).json({ error: error.message })
    }

    console.log(error); // Winston
    return res.status(500).json({ error: 'unknown error' });
  }


  loginUser = (req: Request, res: Response, next: NextFunction) => {

    const [error, loginUserDto] = LoginUserDto.execute(req.body)

    if (error) {

      res.status(400).json({ error });
      return
    }

    new LoginUserUseCase(this.authRepository)
      .execute(loginUserDto!)
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        console.log(error)
        this.handleError(error, res)
      })

  }

  registerUser = (req: Request, res: Response) => {

    // console.log(req.body)

    const [error, createUserDto] = CreateUserDto.execute(req.body)



    if (error) {
      res.status(400).json({ error });
      return
    }

    new RegisterUserUseCase(this.authRepository)
      .execute(createUserDto)
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        console.log(error['message'])
        this.handleError(error, res)
      })

  }

  renewToken = (req: Request, res: Response) => {

    const user = req.body.user


    new RenewTokenUseCase()
      .execute(user)
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        console.log(error['message'])
        this.handleError(error, res)
      })
  }

  


  checkField = (req: Request, res: Response) => {

    console.log(req.query)

    const { field, value } = req.query as Record<string, string>

    const [error, checkFieldDto] = CheckFieldDto.execute({ field, value })

    if (error) {
      res.status(400).json({ error })
      return
    }


    new CheckFieldUseCase(this.authRepository)
      .execute(checkFieldDto)
      .then((exists) => {
        res.json({ exists })
      })
      .catch((error) => {
        console.log(error['message'])
        this.handleError(error, res)
      })
  }


}