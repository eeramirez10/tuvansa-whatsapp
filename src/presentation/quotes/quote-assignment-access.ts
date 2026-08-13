import { UserRole } from '@prisma/client'

const getBranchIds = (user: any): string[] => {
  const values = [
    `${user?.branchId ?? ''}`.trim(),
    ...(Array.isArray(user?.branchIds) ? user.branchIds.map((branchId: unknown) => `${branchId ?? ''}`.trim()) : []),
    ...(Array.isArray(user?.branchAssignments) ? user.branchAssignments.map((item: any) => `${item?.branchId ?? ''}`.trim()) : [])
  ].filter(Boolean)

  return [...new Set(values)]
}

export const canAssignVendorFromScope = (assigner: any, seller: any): boolean => {
  if (assigner?.role === UserRole.ADMIN) return true
  if (assigner?.role !== UserRole.SALES_COORDINATOR) return false

  const allowedBranchIds = getBranchIds(assigner)
  const sellerBranchIds = getBranchIds(seller)

  return sellerBranchIds.length === 1
    && sellerBranchIds.every((branchId) => allowedBranchIds.includes(branchId))
}
