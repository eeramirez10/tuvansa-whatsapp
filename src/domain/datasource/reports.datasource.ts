import { QuotesByBranchReportResponse } from "../dtos/reports/quotes-by-branch-report-response";
import { QuotesByBranchReportDto } from "../dtos/reports/quotes-by-branch-report.dto";
import { QuotesByBranchStatusReportResponse } from "../dtos/reports/quotes-by-branch-status-report-response";
import { QuotesByBranchStatusReportDto } from "../dtos/reports/quotes-by-branch-status-report.dto";

export abstract class ReportsDatasource {

  abstract getQuotesByBranch(dto: QuotesByBranchReportDto): Promise<QuotesByBranchReportResponse>

  abstract getQuotesByBranchStatus(dto: QuotesByBranchStatusReportDto): Promise<QuotesByBranchStatusReportResponse>;

}
