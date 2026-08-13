import test from 'node:test'
import assert from 'node:assert/strict'
import { UserRole } from '@prisma/client'
import { canAssignVendorFromScope } from '../../../src/presentation/quotes/quote-assignment-access'

test('coordinador puede asignar a un vendedor de cualquiera de sus sucursales', () => {
  const coordinator = {
    role: UserRole.SALES_COORDINATOR,
    branchId: 'monterrey',
    branchAssignments: [
      { branchId: 'monterrey' },
      { branchId: 'mexico' },
      { branchId: 'guadalajara' }
    ]
  }

  assert.equal(canAssignVendorFromScope(coordinator, {
    role: UserRole.VENDOR,
    branchId: 'mexico'
  }), true)
})

test('coordinador no puede asignar a un vendedor fuera de sus sucursales', () => {
  const coordinator = {
    role: UserRole.SALES_COORDINATOR,
    branchAssignments: [{ branchId: 'monterrey' }]
  }

  assert.equal(canAssignVendorFromScope(coordinator, {
    role: UserRole.VENDOR,
    branchId: 'puebla'
  }), false)
})

test('administrador puede asignar cualquier vendedor activo validado por el controlador', () => {
  assert.equal(canAssignVendorFromScope(
    { role: UserRole.ADMIN },
    { role: UserRole.VENDOR, branchId: 'puebla' }
  ), true)
})
