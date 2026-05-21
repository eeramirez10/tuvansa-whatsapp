
type Options = {
  branchId: string | null
  branchName: string
  totalQuotes: number
  percentage: number;
}

export class QuotesByBranchReportItem {
  branchId: string | null
  branchName: string
  totalQuotes: number
  percentage: number;

  constructor(options: Options) {
    this.branchId = options.branchId
    this.branchName = options.branchName
    this.totalQuotes = options.totalQuotes
    this.percentage = options.percentage
  }

}
