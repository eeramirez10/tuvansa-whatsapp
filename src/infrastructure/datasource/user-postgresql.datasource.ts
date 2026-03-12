import { UserDatasource } from "../../domain/datasource/user.datasource";
import { BranchUserResponse } from "../../domain/dtos/users/branch-user-response.dto";
import { InternalEmployeeResponseDto, UserRole } from "../../domain/dtos/users/internal-employee-response.dto";
import { GetUserNotificationSettingsDto } from "../../domain/dtos/users/get-user-notification-settings.dto";
import { NotificationRecipientDto } from "../../domain/dtos/users/notification-recipient.dto";
import { UpsertUserNotificationSettingDto } from "../../domain/dtos/users/upsert-user-notification-setting.dto";
import { UserNotificationSettingResponseDto } from "../../domain/dtos/users/user-notification-setting-response.dto";
import { UsersResponseDTO } from "../../domain/dtos/users/users-response.dto";
import { UpdateUserDto } from "../../domain/dtos/users/update-user.dto";
import {
  NotificationChannel,
  NotificationScope,
  QuoteNotificationEvent,
  WhatsappNotificationTemplate
} from "../../domain/enums/notification.enum";
import { BcryptAdapter } from "../../config/bcrypt";
import {
  Channel as PrismaChannel,
  NotificationScope as PrismaNotificationScope,
  PrismaClient,
  Prisma,
  QuoteNotificationEvent as PrismaQuoteNotificationEvent,
  WhatsappNotificationTemplate as PrismaWhatsappNotificationTemplate
} from '@prisma/client';


const prisma = new PrismaClient()

export class UserPostgresqlDatasource implements UserDatasource {


  async findByWaID(waId: string): Promise<InternalEmployeeResponseDto | null> {

    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        AND: [{
          phone: waId,
        }, {
          phone: { not: null }
        }]

      },
      select: {
        id: true,
        name: true,
        role: true,
        branchId: true,
        branchAssignments: {
          select: {
            branchId: true
          }
        },
        phone: true,
        allowWhatsappAssistant: true
      }
    })

    if (!user) return null

    return new InternalEmployeeResponseDto({
      ...user,
      role: user.role as unknown as UserRole,
      branchIds: this.applyRoleBranchLimit(
        user.role as unknown as UserRole,
        this.normalizeBranchIds(
          user.branchId,
          user.branchAssignments.map((item) => item.branchId)
        )
      )
    })
  }

  async list(): Promise<UsersResponseDTO[]> {
    const users = await prisma.user.findMany({
      include: {
        branch: true,
        branchAssignments: {
          include: {
            branch: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return users.map(user => {
      const allBranches = this.buildUserBranches({
        branch: user.branch,
        assigned: user.branchAssignments.map((item) => item.branch)
      })
      const allowedBranchIds = this.applyRoleBranchLimit(
        user.role as unknown as UserRole,
        allBranches.map((branch) => branch.id)
      )
      const branches = allBranches.filter((branch) => allowedBranchIds.includes(branch.id))

      return new UsersResponseDTO({
        ...user,
        branch: user.branch
          ? new BranchUserResponse(
              user.branch.id,
              user.branch.name,
              user.branch.address
            )
          : null,
        branches
      })
    })
  }

  async update(updateUserDto: UpdateUserDto): Promise<UsersResponseDTO> {
    const existingUser = await prisma.user.findUnique({
      where: { id: updateUserDto.userId },
      select: { id: true }
    })

    if (!existingUser) {
      throw new Error('Usuario no encontrado')
    }

    const conflictingUser = await prisma.user.findFirst({
      where: {
        id: { not: updateUserDto.userId },
        OR: [
          { email: updateUserDto.email },
          { username: updateUserDto.username },
          ...(updateUserDto.phone ? [{ phone: updateUserDto.phone }] : [])
        ]
      },
      select: { id: true, email: true, username: true, phone: true }
    })

    if (conflictingUser) {
      if (conflictingUser.email === updateUserDto.email) throw new Error('Email ya está en uso')
      if (conflictingUser.username === updateUserDto.username) throw new Error('Usuario ya está en uso')
      if (conflictingUser.phone && conflictingUser.phone === updateUserDto.phone) throw new Error('Teléfono ya está en uso')
    }

    if (updateUserDto.role !== 'BRANCH_MANAGER' && updateUserDto.branchIds.length > 1) {
      throw new Error('Solo BRANCH_MANAGER puede tener múltiples sucursales')
    }

    const branches = await prisma.branch.findMany({
      where: {
        id: { in: updateUserDto.branchIds }
      },
      select: { id: true }
    })
    if (branches.length !== updateUserDto.branchIds.length) {
      throw new Error('Sucursal no encontrada')
    }

    try {
      const updatedUser = await prisma.$transaction(async (tx) => {
        await tx.userBranchAssignment.deleteMany({
          where: { userId: updateUserDto.userId }
        })

        const user = await tx.user.update({
          where: { id: updateUserDto.userId },
          data: {
            name: updateUserDto.name,
            lastname: updateUserDto.lastname,
            username: updateUserDto.username,
            email: updateUserDto.email,
            phone: updateUserDto.phone,
            role: updateUserDto.role,
            branchId: updateUserDto.branchIds[0] ?? null,
            isActive: updateUserDto.isActive,
            allowWhatsappAssistant: updateUserDto.allowWhatsappAssistant,
            ...(updateUserDto.password ? { password: BcryptAdapter.hash(updateUserDto.password) } : {})
          }
        })

        if (updateUserDto.branchIds.length > 0) {
          await tx.userBranchAssignment.createMany({
            data: updateUserDto.branchIds.map((branchId) => ({
              userId: updateUserDto.userId,
              branchId
            })),
            skipDuplicates: true
          })
        }

        return tx.user.findUniqueOrThrow({
          where: { id: user.id },
          include: {
            branch: true,
            branchAssignments: {
              include: {
                branch: true
              }
            }
          }
        })
      })

      return new UsersResponseDTO({
        ...updatedUser,
        branch: updatedUser.branch
          ? new BranchUserResponse(
              updatedUser.branch.id,
              updatedUser.branch.name,
              updatedUser.branch.address
            )
          : null,
        branches: this.buildUserBranches({
          branch: updatedUser.branch,
          assigned: updatedUser.branchAssignments.map((item) => item.branch)
        })
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new Error('Datos únicos duplicados')
      }
      throw error
    }
  }

  async listNotificationSettings(
    getUserNotificationSettingsDto: GetUserNotificationSettingsDto
  ): Promise<UserNotificationSettingResponseDto[]> {
    const where: Record<string, any> = {}

    if (getUserNotificationSettingsDto.userId) where.userId = getUserNotificationSettingsDto.userId
    if (getUserNotificationSettingsDto.event) where.event = this.toPrismaEvent(getUserNotificationSettingsDto.event)
    if (getUserNotificationSettingsDto.channel) where.channel = this.toPrismaChannel(getUserNotificationSettingsDto.channel)
    if (getUserNotificationSettingsDto.enabled !== undefined) where.enabled = getUserNotificationSettingsDto.enabled

    const settings = await prisma.userNotificationSetting.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            role: true,
            branchId: true,
            branchAssignments: {
              select: {
                branchId: true
              }
            },
            phone: true,
            email: true
          }
        }
      },
      orderBy: [
        { event: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    return settings.map((setting) => new UserNotificationSettingResponseDto({
      ...setting,
      event: this.fromPrismaEvent(setting.event),
      channel: this.fromPrismaChannel(setting.channel),
      template: this.fromPrismaTemplate(setting.template),
      scope: this.fromPrismaScope(setting.scope),
      user: {
        id: setting.user.id,
        name: setting.user.name,
        lastname: setting.user.lastname,
        role: setting.user.role as unknown as UserRole,
        branchId: setting.user.branchId,
        phone: setting.user.phone,
        email: setting.user.email
      }
    }))
  }

  async upsertNotificationSetting(
    upsertUserNotificationSettingDto: UpsertUserNotificationSettingDto
  ): Promise<UserNotificationSettingResponseDto> {
    const user = await prisma.user.findUnique({
      where: { id: upsertUserNotificationSettingDto.userId },
      select: { id: true }
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    const setting = await prisma.userNotificationSetting.upsert({
      where: {
        userId_event_channel: {
          userId: upsertUserNotificationSettingDto.userId,
          event: this.toPrismaEvent(upsertUserNotificationSettingDto.event),
          channel: this.toPrismaChannel(upsertUserNotificationSettingDto.channel)
        }
      },
      update: {
        template: this.toPrismaTemplate(upsertUserNotificationSettingDto.template),
        scope: this.toPrismaScope(upsertUserNotificationSettingDto.scope),
        enabled: upsertUserNotificationSettingDto.enabled
      },
      create: {
        userId: upsertUserNotificationSettingDto.userId,
        event: this.toPrismaEvent(upsertUserNotificationSettingDto.event),
        channel: this.toPrismaChannel(upsertUserNotificationSettingDto.channel),
        template: this.toPrismaTemplate(upsertUserNotificationSettingDto.template),
        scope: this.toPrismaScope(upsertUserNotificationSettingDto.scope),
        enabled: upsertUserNotificationSettingDto.enabled
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            role: true,
            branchId: true,
            branchAssignments: {
              select: {
                branchId: true
              }
            },
            phone: true,
            email: true
          }
        }
      }
    })

    return new UserNotificationSettingResponseDto({
      ...setting,
      event: this.fromPrismaEvent(setting.event),
      channel: this.fromPrismaChannel(setting.channel),
      template: this.fromPrismaTemplate(setting.template),
      scope: this.fromPrismaScope(setting.scope),
      user: {
        id: setting.user.id,
        name: setting.user.name,
        lastname: setting.user.lastname,
        role: setting.user.role as unknown as UserRole,
        branchId: setting.user.branchId,
        phone: setting.user.phone,
        email: setting.user.email
      }
    })
  }

  async getNotificationRecipients(options: {
    event: QuoteNotificationEvent
    channel?: NotificationChannel
    quoteBranchId?: string | null
  }): Promise<NotificationRecipientDto[]> {
    const channel = options.channel ?? NotificationChannel.WHATSAPP
    const recipientsMap = new Map<string, NotificationRecipientDto>()

    const settings = await prisma.userNotificationSetting.findMany({
      where: {
        event: this.toPrismaEvent(options.event),
        channel: this.toPrismaChannel(channel),
        enabled: true,
        user: {
          isActive: true,
          phone: { not: null }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastname: true,
            role: true,
            branchId: true,
            branchAssignments: {
              select: {
                branchId: true
              }
            },
            phone: true,
            email: true
          }
        }
      }
    })

    for (const setting of settings) {
      const phone = `${setting.user.phone ?? ''}`.trim()
      if (!phone) continue

      const branchIds = this.applyRoleBranchLimit(
        setting.user.role as unknown as UserRole,
        this.normalizeBranchIds(
          setting.user.branchId,
          setting.user.branchAssignments.map((item) => item.branchId)
        )
      )
      if (
        `${setting.scope}` === NotificationScope.OWN_BRANCH &&
        (!options.quoteBranchId || !branchIds.includes(options.quoteBranchId))
      ) {
        continue
      }

      recipientsMap.set(setting.user.id, new NotificationRecipientDto({
        userId: setting.user.id,
        name: setting.user.name,
        lastname: setting.user.lastname,
        role: setting.user.role as unknown as UserRole,
        branchId: setting.user.branchId,
        branchIds,
        phone,
        email: setting.user.email,
        event: this.fromPrismaEvent(setting.event),
        channel: this.fromPrismaChannel(setting.channel),
        template: this.fromPrismaTemplate(setting.template),
        scope: this.fromPrismaScope(setting.scope)
      }))
    }

    return [...recipientsMap.values()]
  }

  private normalizeBranchIds(primaryBranchId?: string | null, branchIds: string[] = []): string[] {
    const values = [
      `${primaryBranchId ?? ''}`.trim(),
      ...branchIds.map((id) => `${id ?? ''}`.trim())
    ].filter(Boolean)

    return [...new Set(values)]
  }

  private applyRoleBranchLimit(role: UserRole, branchIds: string[]): string[] {
    const values = [...new Set(branchIds.filter(Boolean))]
    if (role === UserRole.BRANCH_MANAGER) return values
    if (values.length === 0) return []
    return [values[0]]
  }

  private buildUserBranches(options: {
    branch?: { id: string; name: string; address?: string | null } | null
    assigned: Array<{ id: string; name: string; address?: string | null }>
  }): BranchUserResponse[] {
    const branchesMap = new Map<string, BranchUserResponse>()

    if (options.branch?.id) {
      branchesMap.set(
        options.branch.id,
        new BranchUserResponse(options.branch.id, options.branch.name, options.branch.address)
      )
    }

    for (const branch of options.assigned) {
      branchesMap.set(
        branch.id,
        new BranchUserResponse(branch.id, branch.name, branch.address)
      )
    }

    return [...branchesMap.values()]
  }

  private toPrismaEvent(value: QuoteNotificationEvent): PrismaQuoteNotificationEvent {
    return `${value}` as PrismaQuoteNotificationEvent
  }

  private fromPrismaEvent(value: unknown): QuoteNotificationEvent {
    return `${value}` as QuoteNotificationEvent
  }

  private toPrismaChannel(value: NotificationChannel): PrismaChannel {
    return `${value}` as PrismaChannel
  }

  private fromPrismaChannel(value: unknown): NotificationChannel {
    return `${value}` as NotificationChannel
  }

  private toPrismaScope(value: NotificationScope): PrismaNotificationScope {
    return `${value}` as PrismaNotificationScope
  }

  private fromPrismaScope(value: unknown): NotificationScope {
    return `${value}` as NotificationScope
  }

  private toPrismaTemplate(value: WhatsappNotificationTemplate): PrismaWhatsappNotificationTemplate {
    return `${value}` as PrismaWhatsappNotificationTemplate
  }

  private fromPrismaTemplate(value: unknown): WhatsappNotificationTemplate {
    return `${value}` as WhatsappNotificationTemplate
  }
}
