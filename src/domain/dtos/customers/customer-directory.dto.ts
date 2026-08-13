export interface CustomerDirectoryScope {
  branchIds?: string[]
  assignedSellerId?: string
}

export interface CustomerDirectoryQuote {
  id: string
  quoteNumber: number
  createdAt: Date
  status: string
  workflowStatus: string
  branchId: string | null
  branch: {
    id: string
    name: string
  } | null
  assignedSeller: {
    id: string
    name: string
    lastname: string
  } | null
}

export interface CustomerDirectoryItem {
  id: string
  name: string
  lastname: string
  email: string
  phone: string
  location: string
  company: string | null
  createdAt: Date
  quoteCount: number
  lastQuoteAt: Date | null
}

export interface CustomerDirectoryDetail extends Omit<CustomerDirectoryItem, 'quoteCount' | 'lastQuoteAt'> {
  quotes: CustomerDirectoryQuote[]
}

export interface CustomerDirectoryPage {
  items: CustomerDirectoryItem[]
  total: number
  page: number
  pageSize: number
}

interface ListCustomersDirectoryOptions {
  search?: unknown
  page?: unknown
  pageSize?: unknown
}

export class ListCustomersDirectoryDto {
  private constructor(
    public readonly search: string,
    public readonly page: number,
    public readonly pageSize: number
  ) {}

  static execute(options: ListCustomersDirectoryOptions): [string?, ListCustomersDirectoryDto?] {
    const search = `${options.search ?? ''}`.trim()
    const page = Number(options.page ?? 1)
    const pageSize = Number(options.pageSize ?? 20)

    if (search.length > 100) return ['La busqueda no puede exceder 100 caracteres']
    if (!Number.isInteger(page) || page < 1) return ['La pagina debe ser un entero mayor a cero']
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
      return ['El tamano de pagina debe estar entre 1 y 50']
    }

    return [undefined, new ListCustomersDirectoryDto(search, page, pageSize)]
  }
}
