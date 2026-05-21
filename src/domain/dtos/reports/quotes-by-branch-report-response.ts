import { QuotesByBranchReportItem } from "./quotes-by-branch-report-item";


type Options = {
  total: number;
  items: QuotesByBranchReportItem[]
}

export class QuotesByBranchReportResponse {

  total: number;
  items: QuotesByBranchReportItem[]

  constructor(options: Options) {

    this.total = options.total
    this.items = options.items

  }
}
