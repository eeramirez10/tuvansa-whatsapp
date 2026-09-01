import test from 'node:test'
import assert from 'node:assert/strict'
import { TUVANSA_AGENT_TOOLS } from '../../src/config/openai-agent.config'
import { QUOTE_PRODUCT_FAMILIES } from '../../src/config/quote-product-requirements.config'

test('declara todas las herramientas implementadas por el backend', () => {
  assert.deepEqual(
    TUVANSA_AGENT_TOOLS.map((tool) => tool.name),
    [
      'get_branches',
      'validate_quote_items',
      'update_customer_info',
      'create_quote_request'
    ]
  )
})

test('incluye las familias cotizables y omite las categorias excluidas', () => {
  assert.equal(QUOTE_PRODUCT_FAMILIES.length, 31)
  assert.equal(QUOTE_PRODUCT_FAMILIES.includes('EQUIPO'), false)
  assert.equal(QUOTE_PRODUCT_FAMILIES.includes('REFACCION'), false)
  assert.equal(QUOTE_PRODUCT_FAMILIES.includes('SERVICIO'), false)
})
