import { QuotesByBranchStatusReportResponse } from "../../../domain/dtos/reports/quotes-by-branch-status-report-response";
import { QuotesByBranchStatusReportDto } from "../../../domain/dtos/reports/quotes-by-branch-status-report.dto";

import { ReportsRepository } from "../../../domain/repositories/reports.repository";

export class GetQuotesByBranchStatusReportUseCase {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  execute(dto: QuotesByBranchStatusReportDto): Promise<QuotesByBranchStatusReportResponse> {
    return this.reportsRepository.getQuotesByBranchStatus(dto);
  }
}