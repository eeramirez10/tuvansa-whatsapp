import type { UsersResponseDTO } from '../../domain/dtos/users/users-response.dto'

export const normalizeUserRole = (role: unknown): string => {
  return `${role ?? ''}`.trim().toUpperCase()
}

export const isAdminUser = (user: any): boolean => {
  return normalizeUserRole(user?.role) === 'ADMIN'
}

export const isSalesCoordinatorUser = (user: any): boolean => {
  return normalizeUserRole(user?.role) === 'SALES_COORDINATOR'
}

export const canManageUsers = (user: any): boolean => {
  return isAdminUser(user) || isSalesCoordinatorUser(user)
}

export const getUserBranchIds = (user: any): string[] => {
  const values = [
    `${user?.branchId ?? ''}`.trim(),
    ...(Array.isArray(user?.branchIds) ? user.branchIds.map((branchId: unknown) => `${branchId ?? ''}`.trim()) : []),
    ...(Array.isArray(user?.branchAssignments) ? user.branchAssignments.map((item: any) => `${item?.branchId ?? ''}`.trim()) : []),
  ].filter(Boolean)

  return [...new Set(values)]
}

export const getManagedUserBranchIds = (user: UsersResponseDTO): string[] => {
  const values = [
    `${user.branch?.id ?? ''}`.trim(),
    ...(Array.isArray(user.branches) ? user.branches.map((branch) => `${branch?.id ?? ''}`.trim()) : []),
  ].filter(Boolean)

  return [...new Set(values)]
}

export const canCoordinatorManageTarget = (currentUser: any, targetUser: UsersResponseDTO): boolean => {
  if (!isSalesCoordinatorUser(currentUser)) return true
  if (normalizeUserRole(targetUser.role) !== 'VENDOR') return false

  const allowedBranchIds = getUserBranchIds(currentUser)
  const targetBranchIds = getManagedUserBranchIds(targetUser)

  return targetBranchIds.length === 1 && targetBranchIds.every((branchId) => allowedBranchIds.includes(branchId))
}

export const filterManageableUsers = (currentUser: any, users: UsersResponseDTO[]): UsersResponseDTO[] => {
  if (isAdminUser(currentUser)) return users
  if (!isSalesCoordinatorUser(currentUser)) return []
  return users.filter((user) => canCoordinatorManageTarget(currentUser, user))
}
