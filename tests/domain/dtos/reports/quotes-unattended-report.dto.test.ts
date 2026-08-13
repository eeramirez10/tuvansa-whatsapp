import test from 'node:test'
import assert from 'node:assert/strict'
import { QuotesUnattendedReportDto } from '../../../../src/domain/dtos/reports/quotes-unattended-report.dto'

test('acepta el reporte general sin filtros', () => {
  const [error, dto] = QuotesUnattendedReportDto.execute({})

  assert.equal(error, undefined)
  assert.equal(dto?.branchId, undefined)
})

test('normaliza el filtro de sucursal', () => {
  const [error, dto] = QuotesUnattendedReportDto.execute({ branchId: '  branch-1  ' })

  assert.equal(error, undefined)
  assert.equal(dto?.branchId, 'branch-1')
})
