import test from 'node:test'
import assert from 'node:assert/strict'
import { ListCustomersDirectoryDto } from '../../../../src/domain/dtos/customers/customer-directory.dto'

test('usa paginacion predeterminada y limpia la busqueda', () => {
  const [error, dto] = ListCustomersDirectoryDto.execute({ search: '  Tuvansa  ' })

  assert.equal(error, undefined)
  assert.equal(dto?.search, 'Tuvansa')
  assert.equal(dto?.page, 1)
  assert.equal(dto?.pageSize, 20)
})

test('rechaza paginas y tamanos fuera de rango', () => {
  assert.equal(ListCustomersDirectoryDto.execute({ page: 0 })[0], 'La pagina debe ser un entero mayor a cero')
  assert.equal(
    ListCustomersDirectoryDto.execute({ pageSize: 51 })[0],
    'El tamano de pagina debe estar entre 1 y 50'
  )
})
