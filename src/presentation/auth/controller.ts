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
import { UserRole } from '@prisma/client';


export class AuthController {

  constructor(private readonly authRepository: AuthRepository) { }


  private handleError = (error: unknown, res: Response) => {
    if (error instanceof CustomError) {

      return res.status(error.statusCode).json({ error: error.message })
    }

    console.log(error); // Winston
    return res.status(500).json({ error: 'unknown error' });
  }

  private getUserBranchIds(user: any): string[] {
    const values = [
      `${user?.branchId ?? ''}`.trim(),
      ...(Array.isArray(user?.branchIds) ? user.branchIds.map((branchId: unknown) => `${branchId ?? ''}`.trim()) : []),
      ...(Array.isArray(user?.branchAssignments) ? user.branchAssignments.map((item: any) => `${item?.branchId ?? ''}`.trim()) : [])
    ].filter(Boolean)

    return [...new Set(values)]
  }

  private canCreateUsers(user: any): boolean {
    return user?.role === UserRole.ADMIN || user?.role === UserRole.SALES_COORDINATOR
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
    const currentUser = req.body.user

    if (!this.canCreateUsers(currentUser)) {
      res.status(403).json({ error: 'No tienes permiso para crear usuarios' })
      return
    }

    const [error, createUserDto] = CreateUserDto.execute(req.body)

    if (error || !createUserDto) {
      res.status(400).json({ error });
      return
    }

    if (currentUser?.role === UserRole.SALES_COORDINATOR) {
      const allowedBranchIds = this.getUserBranchIds(currentUser)
      if (allowedBranchIds.length === 0) {
        res.status(403).json({ error: 'Tu usuario no tiene sucursales asignadas para crear usuarios' })
        return
      }

      const hasForbiddenBranch = createUserDto.branchIds.some((branchId) => !allowedBranchIds.includes(branchId))
      if (hasForbiddenBranch) {
        res.status(403).json({ error: 'Solo puedes crear usuarios en tus sucursales asignadas' })
        return
      }

      if (createUserDto.role === UserRole.ADMIN || createUserDto.role === UserRole.SALES_COORDINATOR) {
        res.status(403).json({ error: 'No puedes crear usuarios con ese rol' })
        return
      }
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
