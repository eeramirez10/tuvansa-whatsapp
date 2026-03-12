import { Request, Response } from 'express';
import { GetUserNotificationSettingsUseCase } from '../../application/use-cases/users/get-user-notification-settings.use-case';
import { SendUserNotificationTestUseCase } from '../../application/use-cases/users/send-user-notification-test.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/users/update-user.use-case';
import { UpsertUserNotificationSettingUseCase } from '../../application/use-cases/users/upsert-user-notification-setting.use-case';
import { SendAllUserNotificationTestsDto } from '../../domain/dtos/users/send-all-user-notification-tests.dto';
import { GetUserNotificationSettingsDto } from '../../domain/dtos/users/get-user-notification-settings.dto';
import { SendUserNotificationTestDto } from '../../domain/dtos/users/send-user-notification-test.dto';
import { UpdateUserDto } from '../../domain/dtos/users/update-user.dto';
import { UpsertUserNotificationSettingDto } from '../../domain/dtos/users/upsert-user-notification-setting.dto';
import { UserRepository } from '../../domain/repositories/user-repository';
import { MessageService } from '../../domain/services/message.service';


export class UsersController {

  constructor(
    private readonly userRepository: UserRepository,
    private readonly messageService: MessageService
  ) {

  }



  getAll = (req: Request, res: Response) => {


    this.userRepository.list()
      .then((users) => {

        return res.status(200).json({ users })
      })
      .catch((e) => {
        console.log(e,'Users Controller')
        res.status(500).json({
          error:'error internal server'
        })
      })

  }

  update = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ''}`.toUpperCase()
    if (requestUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' })
    }

    const [error, dto] = UpdateUserDto.execute({
      userId: req.params.id,
      ...req.body
    })

    if (error || !dto) {
      return res.status(400).json({ error: error ?? 'Payload inválido' })
    }

    new UpdateUserUseCase(this.userRepository)
      .execute(dto)
      .then((user) => {
        return res.status(200).json({ user })
      })
      .catch((e) => {
        console.log(e, 'Users Controller update')
        const message = `${e?.message ?? ''}` || 'error internal server'
        const statusCode = message === 'error internal server' ? 500 : 400
        res.status(statusCode).json({
          error: message
        })
      })
  }

  getNotificationSettings = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ''}`.toUpperCase()
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

  upsertNotificationSetting = (req: Request, res: Response) => {
    const requestUserRole = `${req.body?.user?.role ?? ''}`.toUpperCase()
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
    const requestUserRole = `${req.body?.user?.role ?? ''}`.toUpperCase()
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
    const requestUserRole = `${req.body?.user?.role ?? ''}`.toUpperCase()
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
}
