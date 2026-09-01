import test from 'node:test'
import assert from 'node:assert/strict'
import { QuoteProductValidator } from '../../src/domain/services/quote-product-validator'

const validator = new QuoteProductValidator()

test('valida una tuberia con sus propiedades minimas y conserva su unidad', () => {
  const result = validator.validate([{
    family: 'TUBERIA',
    description: 'Tubo de acero al carbon de 6 pulgadas',
    quantity: 20,
    um: 'METRO',
    specifications: [
      { name: 'material', value: 'acero al carbon' },
      { name: 'diametro', value: '6 pulgadas' },
      { name: 'cedula_o_espesor', value: 'cedula 40' },
      { name: 'costura', value: 'sin costura' }
    ]
  }])

  assert.equal(result.valid, true)
  assert.equal(result.items[0].quantity, 20)
  assert.equal(result.items[0].um, 'METRO')
  assert.match(result.items[0].description, /sin costura/i)
})

test('indica solamente las propiedades faltantes de un producto', () => {
  const result = validator.validate([{
    family: 'TUBERIA',
    description: 'Tubo de acero al carbon de 6 pulgadas',
    quantity: 20,
    um: 'METRO',
    specifications: [
      { name: 'material', value: 'acero al carbon' },
      { name: 'diametro', value: '6 pulgadas' },
      { name: 'cedula_o_espesor', value: 'cedula 40' }
    ]
  }])

  assert.equal(result.valid, false)
  assert.deepEqual(result.issues[0].missingFields, ['con costura o sin costura'])
})

test('usa PIEZA para una brida sin preguntar una unidad adicional', () => {
  const result = validator.validate([{
    family: 'BRIDA',
    description: 'Brida deslizante de 6 pulgadas',
    quantity: 15,
    specifications: [
      { name: 'tipo', value: 'deslizante' },
      { name: 'diametro', value: '6 pulgadas' },
      { name: 'clase', value: '150 lb' },
      { name: 'cara', value: 'RF' },
      { name: 'material', value: 'acero al carbon' }
    ]
  }])

  assert.equal(result.valid, true)
  assert.equal(result.items[0].um, 'PIEZA')
})

test('rechaza Equipo, Refaccion y Servicio como familias no soportadas', () => {
  for (const family of ['EQUIPO', 'REFACCION', 'SERVICIO']) {
    const result = validator.validate([{
      family,
      description: family,
      quantity: 1,
      specifications: []
    }])

    assert.equal(result.valid, false)
    assert.equal(result.issues[0].unsupported, true)
  }
})

test('solicita diametro de derivacion solo cuando una tee es reducida', () => {
  const result = validator.validate([{
    family: 'TEE_YEE_CRUZ',
    description: 'Tee reducida de acero al carbon',
    quantity: 2,
    specifications: [
      { name: 'tipo', value: 'tee reducida' },
      { name: 'material', value: 'acero al carbon' },
      { name: 'diametro_principal', value: '6 pulgadas' },
      { name: 'cedula_o_clase', value: 'cedula 40' },
      { name: 'conexion', value: 'soldable' }
    ]
  }])

  assert.equal(result.valid, false)
  assert.deepEqual(result.issues[0].missingFields, ['diametro de derivacion cuando sea reducida'])
})
