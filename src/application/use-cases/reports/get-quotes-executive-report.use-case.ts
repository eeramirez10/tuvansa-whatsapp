import { QuotesExecutiveReportResponse } from "../../../domain/dtos/reports/quotes-executive-report-response";
import { QuotesExecutiveReportDto } from "../../../domain/dtos/reports/quotes-executive-report.dto";
import { ReportsRepository } from "../../../domain/repositories/reports.repository";

export class GetQuotesExecutiveReportUseCase {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  execute(dto: QuotesExecutiveReportDto): Promise<QuotesExecutiveReportResponse> {
    return this.reportsRepository.getQuotesExecutiveReport(dto);
  }
}
