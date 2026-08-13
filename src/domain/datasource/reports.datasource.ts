import { QuotesByBranchReportResponse } from "../dtos/reports/quotes-by-branch-report-response";
import { QuotesByBranchReportDto } from "../dtos/reports/quotes-by-branch-report.dto";
import { QuotesByBranchStatusReportResponse } from "../dtos/reports/quotes-by-branch-status-report-response";
import { QuotesByBranchStatusReportDto } from "../dtos/reports/quotes-by-branch-status-report.dto";
import { QuotesExecutiveReportDto } from "../dtos/reports/quotes-executive-report.dto";
import { QuotesExecutiveReportResponse } from "../dtos/reports/quotes-executive-report-response";
import { QuotesUnattendedReportDto } from "../dtos/reports/quotes-unattended-report.dto";
import { QuotesUnattendedReportResponse } from "../dtos/reports/quotes-unattended-report-response";

export abstract class ReportsDatasource {
  abstract getQuotesByBranch(dto: QuotesByBranchReportDto): Promise<QuotesByBranchReportResponse>;

  abstract getQuotesByBranchStatus(dto: QuotesByBranchStatusReportDto): Promise<QuotesByBranchStatusReportResponse>;

  abstract getQuotesExecutiveReport(dto: QuotesExecutiveReportDto): Promise<QuotesExecutiveReportResponse>;

  abstract getQuotesUnattendedReport(dto: QuotesUnattendedReportDto): Promise<QuotesUnattendedReportResponse>;
}
