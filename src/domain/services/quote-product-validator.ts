import {
  QUOTE_PRODUCT_FIELD_LABELS,
  QUOTE_PRODUCT_REQUIREMENTS
} from '../../config/quote-product-requirements.config'
import {
  QuoteProductDraft,
  QuoteProductValidationIssue,
  QuoteProductValidationResult,
  QuoteProductSpecification,
  ValidatedQuoteProduct
} from '../interfaces/quote-product-draft'

const normalizeKey = (value: string): string => value
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

const normalizeFamily = (value: string): string => normalizeKey(value).toUpperCase()

const FIELD_ALIASES: Record<string, string> = {
  con_costura_o_sin_costura: 'costura',
  tipo_de_conexion: 'conexion',
  cedula_clase: 'cedula_o_clase',
  clase_presion: 'clase_o_presion',
  presion_figura_modelo: 'presion_o_modelo',
  alimentacion_o_voltaje: 'alimentacion'
}

export class QuoteProductValidator {
  validate(items: QuoteProductDraft[]): QuoteProductValidationResult {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        valid: false,
        issues: [{
          index: 0,
          family: '',
          description: '',
          missingFields: ['productos'],
          unsupported: false
        }],
        items: []
      }
    }

    const issues: QuoteProductValidationIssue[] = []
    const validItems: ValidatedQuoteProduct[] = []

    items.forEach((item, index) => {
      const family = normalizeFamily(item?.family ?? '')
      const requirement = QUOTE_PRODUCT_REQUIREMENTS.find((entry) => entry.family === family)

      if (!requirement) {
        issues.push({
          index,
          family: family || `${item?.family ?? ''}`,
          description: `${item?.description ?? ''}`.trim(),
          missingFields: [],
          unsupported: true
        })
        return
      }

      const specifications = this.toSpecificationMap(item.specifications)
      const requiredFields = [
        ...requirement.requiredFields,
        ...(requirement.conditionalFields ?? [])
          .filter(({ whenField, contains }) => {
            const value = specifications.get(normalizeKey(whenField)) ?? ''
            return normalizeKey(value).includes(normalizeKey(contains))
          })
          .map(({ requiredField }) => requiredField)
      ]
      const missingFields = requiredFields
        .filter((field) => !specifications.get(normalizeKey(field)))
        .map((field) => QUOTE_PRODUCT_FIELD_LABELS[field] ?? field)

      const quantity = Number(item.quantity)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        missingFields.push('cantidad')
      }

      const requestedUnit = `${item.um ?? ''}`.trim()
      if (requirement.requiresUnit && !requestedUnit) {
        missingFields.push('unidad')
      }

      if (!`${item.description ?? ''}`.trim()) {
        missingFields.push('descripcion')
      }

      if (missingFields.length > 0) {
        issues.push({
          index,
          family,
          description: `${item.description ?? ''}`.trim(),
          missingFields: [...new Set(missingFields)],
          unsupported: false
        })
        return
      }

      validItems.push({
        description: this.buildDescription(requirement.label, item.description, specifications),
        quantity,
        um: requestedUnit || requirement.defaultUnit || 'PIEZA',
        ean: '',
        codigo: ''
      })
    })

    return {
      valid: issues.length === 0,
      issues,
      items: issues.length === 0 ? validItems : []
    }
  }

  private toSpecificationMap(specifications?: QuoteProductSpecification[]): Map<string, string> {
    const result = new Map<string, string>()

    for (const specification of specifications ?? []) {
      const normalizedKey = normalizeKey(`${specification?.name ?? ''}`)
      const key = FIELD_ALIASES[normalizedKey] ?? normalizedKey
      const value = `${specification?.value ?? ''}`.trim()
      if (key && value) result.set(key, value)
    }

    return result
  }

  private buildDescription(label: string, description: string, specifications: Map<string, string>): string {
    const details = [...specifications.entries()]
      .map(([key, value]) => `${QUOTE_PRODUCT_FIELD_LABELS[key] ?? key}: ${value}`)
      .join('; ')
    const base = `${description}`.trim() || label
    return details ? `${base} | ${details}` : base
  }
}
