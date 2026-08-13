import { Request, Response } from 'express';
import { DeleteUserNotificationSettingUseCase } from '../../application/use-cases/users/delete-user-notification-setting.use-case';
import { GetUserNotificationSettingsUseCase } from '../../application/use-cases/users/get-user-notification-settings.use-case';
import { GetInProgressReminderConfigUseCase } from '../../application/use-cases/users/get-in-progress-reminder-config.use-case';
import { SendUserNotificationTestUseCase } from '../../application/use-cases/users/send-user-notification-test.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { UpdateInProgressReminderConfigUseCase } from '../../application/use-cases/users/update-in-progress-reminder-config.use-case';
import { UpsertUserNotificationSettingUseCase } from '../../application/use-cases/users/upsert-user-notification-setting.use-case';
import { DeleteUserNotificationSettingDto } from '../../domain/dtos/users/delete-user-notification-setting.dto';
import { SendAllUserNotificationTestsDto } from '../../domain/dtos/users/send-all-user-notification-tests.dto';
import { GetUserNotificationSettingsDto } from '../../domain/dtos/users/get-user-notification-settings.dto';
import { SendUserNotificationTestDto } from '../../domain/dtos/users/send-user-notification-test.dto';
import { UpdateInProgressReminderConfigDto } from '../../domain/dtos/users/update-in-progress-reminder-config.dto';
import { UpdateUserDto } from '../../domain/dtos/users/update-user.dto';
import { UpsertUserNotificationSettingDto } from '../../domain/dtos/users/upsert-user-notification-setting.dto';
import { UsersResponseDTO } from '../../domain/dtos/users/users-response.dto';
import { UserRepository } from '../../domain/repositories/user-repository';
import { MessageService } from '../../domain/services/message.service';
import {
  canCoordinatorManageTarget,
  canManageUsers,
  filterManageableUsers,
  getUserBranchIds,
  isAdminUser,
  isSalesCoordinatorUser,
  normalizeUserRole
} from './user-access';

export class UsersController {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly messageService: MessageService
  ) {}

  private normalizeRole(role: unknown): string {
    return normalizeUserRole(role)
  }

  private isAdmin(user: any): boolean {
    return isAdminUser(user)
  }

  private isSalesCoordinator(user: any): boolean {
    return isSalesCoordinatorUser(user)
  }

  private canManageUsers(user: any): boolean {
    return canManageUsers(user)
  }

  private getUserBranchIds(user: any): string[] {
    return getUserBranchIds(user)
  }

  private canCoordinatorManageTarget(currentUser: any, targetUser: UsersResponseDTO): boolean {
    return canCoordinatorManageTarget(currentUser, targetUser)
  }

  private filterManageableUsers(currentUser: any, users: UsersResponseDTO[]): UsersResponseDTO[] {
    return filterManageableUsers(currentUser, users)
  }

  private async getManageableTargetUser(currentUser: any, userId: string): Promise<UsersResponseDTO | null> {
    const users = await this.userRepository.list()
    const targetUser = users.find((user) => user.id === userId) ?? null
    if (!targetUser) return null
    if (!this.canCoordinatorManageTarget(currentUser, targetUser) && !this.isAdmin(currentUser)) return null
    return targetUser
  }

  getAll = async (req: Request, res: Response) => {
    const currentUser = req.body?.user
    const manageableOnly = ['true', '1'].includes(`${req.query?.manageableOnly ?? ""}`.toLowerCase())

    try {
      const users = await this.userRepository.list()

      if (!manageableOnly) {
        return res.status(200).json({ users })
      }

      if (!this.canManageUsers(currentUser)) {
        return res.status(403).json({ error: 'No autorizado' })
      }

      return res.status(200).json({ users: this.filterManageableUsers(currentUser, users) })
    } catch (e) {
      console.log(e, 'Users Controller')
      return res.status(500).json({ error: 'error internal server' })
    }
  }

  update = async (req: Request, res: Response) => {
    const currentUser = req.body?.user
    const userId = `${req.params.id ?? ""}`

    if (!this.canManageUsers(currentUser)) {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const [error, dto] = UpdateUserDto.execute({
      userId,
      ...req.body,
    })

    if (error || !dto) {
      return res.status(400).json({ error: error ?? 'Payload inválido' })
    }

    try {
      if (this.isSalesCoordinator(currentUser)) {
        const targetUser = await this.getManageableTargetUser(currentUser, userId)

        if (!targetUser) {
          return res.status(403).json({ error: 'Solo puedes editar vendedores de tus sucursales asignadas' })
        }

        if (this.normalizeRole(dto.role) !== 'VENDOR') {
          return res.status(403).json({ error: 'Solo puedes gestionar usuarios con rol VENDOR' })
        }

        const allowedBranchIds = this.getUserBranchIds(currentUser)
        const hasForbiddenBranch = dto.branchIds.some((branchId) => !allowedBranchIds.includes(branchId))
        if (hasForbiddenBranch) {
          return res.status(403).json({ error: 'Solo puedes asignar sucursales dentro de tu alcance' })
        }

        if (dto.branchIds.length !== 1) {
          return res.status(403).json({ error: 'Los vendedores solo pueden tener una sucursal' })
        }
      }

      const user = await new UpdateUserUseCase(this.userRepository).execute(dto)
      return res.status(200).json({ user })
    } catch (e: any) {
      console.log(e, 'Users Controller update')
      const message = `${e?.message ?? ""}` || 'error internal server'
      const statusCode = message === 'error internal server' ? 500 : 400
      return res.status(statusCode).json({ error: message })
    }
  }

  delete = async (req: Request, res: Response) => {
    const currentUser = req.body?.user
    const userId = `${req.params.id ?? ""}`

    if (!this.canManageUsers(currentUser)) {
      return res.status(403).json({ error: 'No autorizado' })
    }

    try {
      if (this.isSalesCoordinator(currentUser)) {
        const targetUser = await this.getManageableTargetUser(currentUser, userId)
        if (!targetUser) {
          return res.status(403).json({ error: 'Solo puedes eliminar vendedores de tus sucursales asignadas' })
        }
      }

      await this.userRepository.delete(userId)
      return res.status(200).json({ ok: true })
    } catch (e: any) {
      console.log(e, 'Users Controller delete')
      const message = `${e?.message ?? ""}` || 'error internal server'
      const statusCode = message === 'Usuario no encontrado' ? 404 : message === 'error internal server' ? 500 : 400
      return res.status(statusCode).json({ error: message })
    }
  }

  getNotificationSettings = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ""}`.toUpperCase()
    if (requestUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const [error, dto] = GetUserNotificationSettingsDto.execute({
      ...req.query
    })

    if (error || !dto) {
      return res.status(400).json({ error: error ?? 'Payload inválido' })
    }

    new GetUserNotificationSettingsUseCase(this.userRepository)
      .execute(dto)
      .then((settings) => {
        return res.status(200).json({ settings })
      })
      .catch((e) => {
        console.log(e, 'Users Controller getNotificationSettings')
        res.status(500).json({
          error: 'error internal server'
        })
      })
  }

  deleteNotificationSetting = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ""}`.toUpperCase()
    if (requestUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const [error, dto] = DeleteUserNotificationSettingDto.execute({
      settingId: req.params.settingId
    })

    if (error || !dto) {
      return res.status(400).json({ error: error ?? 'Payload inválido' })
    }

    new DeleteUserNotificationSettingUseCase(this.userRepository)
      .execute(dto)
      .then(() => {
        return res.status(200).json({ ok: true })
      })
      .catch((e) => {
        console.log(e, 'Users Controller deleteNotificationSetting')
        const message = `${e?.message ?? ""}` || 'error internal server'
        const statusCode = message === 'Configuración de notificación no encontrada' ? 404 : 500
        res.status(statusCode).json({
          error: message
        })
      })
  }

  upsertNotificationSetting = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ""}`.toUpperCase()
    if (requestUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const [error, dto] = UpsertUserNotificationSettingDto.execute({
      ...req.body
    })

    if (error || !dto) {
      return res.status(400).json({ error: error ?? 'Payload inválido' })
    }

    new UpsertUserNotificationSettingUseCase(this.userRepository)
      .execute(dto)
      .then((setting) => {
        return res.status(200).json({ setting })
      })
      .catch((e) => {
        console.log(e, 'Users Controller upsertNotificationSetting')
        res.status(500).json({
          error: 'error internal server'
        })
      })
  }

  sendNotificationTest = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ""}`.toUpperCase()
    if (requestUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const [error, dto] = SendUserNotificationTestDto.execute({
      ...req.body
    })

    if (error || !dto) {
      return res.status(400).json({ error: error ?? 'Payload inválido' })
    }

    new SendUserNotificationTestUseCase(this.userRepository, this.messageService)
      .execute(dto)
      .then((result) => {
        return res.status(200).json({ result })
      })
      .catch((e) => {
        console.log(e, 'Users Controller sendNotificationTest')
        res.status(500).json({
          error: 'error internal server'
        })
      })
  }

  sendNotificationTests = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ""}`.toUpperCase()
    if (requestUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const [error, dto] = SendAllUserNotificationTestsDto.execute({
      ...req.body
    })

    if (error || !dto) {
      return res.status(400).json({ error: error ?? 'Payload inválido' })
    }

    new SendUserNotificationTestUseCase(this.userRepository, this.messageService)
      .executeAll(dto)
      .then((result) => {
        return res.status(200).json(result)
      })
      .catch((e) => {
        console.log(e, 'Users Controller sendNotificationTests')
        res.status(500).json({
          error: 'error internal server'
        })
      })
  }

  getInProgressReminderConfig = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ""}`.toUpperCase()
    if (requestUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    new GetInProgressReminderConfigUseCase(this.userRepository)
      .execute()
      .then((enabled) => {
        return res.status(200).json({ enabled })
      })
      .catch((e) => {
        console.log(e, 'Users Controller getInProgressReminderConfig')
        res.status(500).json({
          error: 'error internal server'
        })
      })
  }

  updateInProgressReminderConfig = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ""}`.toUpperCase()
    if (requestUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const [error, dto] = UpdateInProgressReminderConfigDto.execute({
      ...req.body
    })

    if (error || !dto) {
      return res.status(400).json({ error: error ?? 'Payload inválido' })
    }

    new UpdateInProgressReminderConfigUseCase(this.userRepository)
      .execute(dto)
      .then((enabled) => {
        return res.status(200).json({ enabled })
      })
      .catch((e) => {
        console.log(e, 'Users Controller updateInProgressReminderConfig')
        res.status(500).json({
          error: 'error internal server'
        })
      })
  }
}
