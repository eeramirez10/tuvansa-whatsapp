interface QuotesUnattendedReportOptions {
  branchId?: string
  branchIds?: string[]
}

export class QuotesUnattendedReportDto {
  branchId?: string
  branchIds?: string[]

  constructor(options: QuotesUnattendedReportOptions) {
    this.branchId = options.branchId
    this.branchIds = options.branchIds
  }

  static execute(values: Record<string, unknown>): [string?, QuotesUnattendedReportDto?] {
    const branchId = `${values.branchId ?? ''}`.trim() || undefined

    return [undefined, new QuotesUnattendedReportDto({ branchId })]
  }
}
