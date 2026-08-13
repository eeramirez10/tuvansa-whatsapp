export interface QuotesUnattendedManager {
  id: string
  name: string
  lastname: string
  email: string
  phone: string | null
}

export interface QuotesUnattendedCustomer {
  id: string
  name: string
  lastname: string
  company: string | null
  email: string
  phone: string
}

export interface QuotesUnattendedQuote {
  id: string
  quoteNumber: number
  createdAt: Date
  ageHours: number
  customer: QuotesUnattendedCustomer
}

export interface QuotesUnattendedBranchRow {
  branchId: string | null
  branchName: string
  manager: QuotesUnattendedManager | null
  totalNew: number
  under24Hours: number
  from24To72Hours: number
  from3To7Days: number
  over7Days: number
  oldestCreatedAt: Date
  oldestAgeHours: number
  quotes: QuotesUnattendedQuote[]
}

export interface QuotesUnattendedReportResponse {
  generatedAt: Date
  kpis: {
    totalNew: number
    branchesWithNew: number
    olderThan24Hours: number
    olderThan72Hours: number
    oldestAgeHours: number
  }
  branches: QuotesUnattendedBranchRow[]
}
