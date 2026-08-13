import test from 'node:test'
import assert from 'node:assert/strict'
import { UserRole } from '@prisma/client'
import { getCustomerDirectoryScope } from '../../../src/presentation/customers/customer-access'

test('administrador consulta todos los clientes', () => {
  assert.deepEqual(getCustomerDirectoryScope({ role: UserRole.ADMIN }), {})
})

test('vendedor consulta cotizaciones asignadas dentro de su unica sucursal', () => {
  assert.deepEqual(
    getCustomerDirectoryScope({
      id: 'vendor-id',
      role: UserRole.VENDOR,
      branchId: 'branch-1',
      branchIds: ['branch-1', 'branch-2']
    }),
    { assignedSellerId: 'vendor-id', branchIds: ['branch-1'] }
  )
})

test('coordinador conserva todas sus sucursales sin duplicados', () => {
  assert.deepEqual(
    getCustomerDirectoryScope({
      role: UserRole.SALES_COORDINATOR,
      branchId: 'branch-1',
      branchIds: ['branch-1', 'branch-2'],
      branchAssignments: [{ branchId: 'branch-3' }]
    }),
    { branchIds: ['branch-1', 'branch-2', 'branch-3'] }
  )
})

test('usuario regular queda limitado a una sucursal', () => {
  assert.deepEqual(
    getCustomerDirectoryScope({
      role: UserRole.USER,
      branchId: 'branch-1',
      branchAssignments: [{ branchId: 'branch-2' }]
    }),
    { branchIds: ['branch-1'] }
  )
})
