import { QuoteWorkflowStatus } from "@prisma/client";

type Options = {
  branchId: string | null;
  branchName: string;
  totalQuotes: number;
  statuses: Record<QuoteWorkflowStatus, number>;
}

export class QuotesByBranchStatusReportItem {
  branchId: string | null;
  branchName: string;
  totalQuotes: number;
  statuses: Record<QuoteWorkflowStatus, number>;

  constructor(option: Options) {

    this.branchId = option.branchId
    this.branchName = option.branchName
    this.totalQuotes = option.totalQuotes
    this.statuses = option.statuses

  }

}