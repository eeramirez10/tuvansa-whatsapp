import test from 'node:test'
import assert from 'node:assert/strict'
import { UserRole } from '@prisma/client'
import { filterManageableUsers } from '../../../src/presentation/users/user-access'

const users = [
  {
    id: 'vendor-monterrey',
    role: UserRole.VENDOR,
    branch: { id: 'monterrey' },
    branches: [{ id: 'monterrey' }]
  },
  {
    id: 'vendor-mexico',
    role: UserRole.VENDOR,
    branch: { id: 'mexico' },
    branches: [{ id: 'mexico' }]
  },
  {
    id: 'vendor-guadalajara',
    role: UserRole.VENDOR,
    branch: { id: 'guadalajara' },
    branches: [{ id: 'guadalajara' }]
  },
  {
    id: 'manager-monterrey',
    role: UserRole.BRANCH_MANAGER,
    branch: { id: 'monterrey' },
    branches: [{ id: 'monterrey' }]
  }
]

test('coordinador obtiene vendedores de todas sus sucursales asignadas', () => {
  const result = filterManageableUsers({
    role: UserRole.SALES_COORDINATOR,
    branchId: 'monterrey',
    branchAssignments: [
      { branchId: 'monterrey' },
      { branchId: 'mexico' }
    ]
  }, users as any)

  assert.deepEqual(
    result.map((user: { id: string }) => user.id),
    ['vendor-monterrey', 'vendor-mexico']
  )
})

test('administrador obtiene todos los usuarios administrables', () => {
  const result = filterManageableUsers({ role: UserRole.ADMIN }, users as any)

  assert.deepEqual(
    result.map((user: { id: string }) => user.id),
    users.map((user) => user.id)
  )
})
