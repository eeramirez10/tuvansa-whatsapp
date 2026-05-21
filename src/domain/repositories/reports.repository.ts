


import { QuotesByBranchReportDto } from "../dtos/reports/quotes-by-branch-report.dto";
import { QuotesByBranchStatusReportDto } from "../dtos/reports/quotes-by-branch-status-report.dto";
import { QuotesByBranchReportResponse } from '../dtos/reports/quotes-by-branch-report-response';
import { QuotesByBranchStatusReportResponse } from '../dtos/reports/quotes-by-branch-status-report-response';

export abstract class ReportsRepository {
  abstract getQuotesByBranch(
    dto: QuotesByBranchReportDto
  ): Promise<QuotesByBranchReportResponse>;

  abstract getQuotesByBranchStatus(
    dto: QuotesByBranchStatusReportDto
  ): Promise<QuotesByBranchStatusReportResponse>;
}
