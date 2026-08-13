import { QuotesByBranchReportResponse } from "../../domain/dtos/reports/quotes-by-branch-report-response";
import { QuotesByBranchReportDto } from "../../domain/dtos/reports/quotes-by-branch-report.dto";
import { QuotesByBranchStatusReportResponse } from "../../domain/dtos/reports/quotes-by-branch-status-report-response";
import { QuotesByBranchStatusReportDto } from "../../domain/dtos/reports/quotes-by-branch-status-report.dto";
import { QuotesExecutiveReportDto } from "../../domain/dtos/reports/quotes-executive-report.dto";
import { QuotesExecutiveReportResponse } from "../../domain/dtos/reports/quotes-executive-report-response";
import { ReportsRepository } from "../../domain/repositories/reports.repository";
import { ReportsDatasource } from '../../domain/datasource/reports.datasource';
import { QuotesUnattendedReportDto } from '../../domain/dtos/reports/quotes-unattended-report.dto';
import { QuotesUnattendedReportResponse } from '../../domain/dtos/reports/quotes-unattended-report-response';

export class ReportsRepositoryImpl extends ReportsRepository {
  constructor(private readonly reportsDatasource: ReportsDatasource) {
    super();
  }

  getQuotesByBranch(dto: QuotesByBranchReportDto): Promise<QuotesByBranchReportResponse> {
    return this.reportsDatasource.getQuotesByBranch(dto);
  }

  getQuotesByBranchStatus(dto: QuotesByBranchStatusReportDto): Promise<QuotesByBranchStatusReportResponse> {
    return this.reportsDatasource.getQuotesByBranchStatus(dto);
  }

  getQuotesExecutiveReport(dto: QuotesExecutiveReportDto): Promise<QuotesExecutiveReportResponse> {
    return this.reportsDatasource.getQuotesExecutiveReport(dto);
  }

  getQuotesUnattendedReport(dto: QuotesUnattendedReportDto): Promise<QuotesUnattendedReportResponse> {
    return this.reportsDatasource.getQuotesUnattendedReport(dto);
  }
}
