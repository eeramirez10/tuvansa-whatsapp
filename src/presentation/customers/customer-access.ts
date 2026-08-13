import { UserRole } from '@prisma/client'
import { CustomerDirectoryScope } from '../../domain/dtos/customers/customer-directory.dto'

interface CustomerAccessUser {
  id?: string | null
  role?: UserRole | string | null
  branchId?: string | null
  branchIds?: unknown[]
  branchAssignments?: Array<{ branchId?: string | null }>
}

export const getCustomerDirectoryScope = (user?: CustomerAccessUser | null): CustomerDirectoryScope => {
  if (user?.role === UserRole.ADMIN) return {}

  const branchIds = [
    `${user?.branchId ?? ''}`.trim(),
    ...(Array.isArray(user?.branchIds)
      ? user.branchIds.map((branchId) => `${branchId ?? ''}`.trim())
      : []),
    ...(Array.isArray(user?.branchAssignments)
      ? user.branchAssignments.map((item) => `${item?.branchId ?? ''}`.trim())
      : [])
  ].filter(Boolean)

  const uniqueBranchIds = [...new Set(branchIds)]
  if (user?.role === UserRole.VENDOR) {
    return {
      assignedSellerId: `${user.id ?? ''}`.trim(),
      branchIds: uniqueBranchIds.slice(0, 1)
    }
  }

  const supportsMultipleBranches = user?.role === UserRole.BRANCH_MANAGER
    || user?.role === UserRole.SALES_COORDINATOR

  return {
    branchIds: supportsMultipleBranches ? uniqueBranchIds : uniqueBranchIds.slice(0, 1)
  }
}
