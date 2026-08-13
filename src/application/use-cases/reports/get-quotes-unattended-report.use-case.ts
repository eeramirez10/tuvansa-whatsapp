import { QuotesUnattendedReportDto } from '../../../domain/dtos/reports/quotes-unattended-report.dto'
import { QuotesUnattendedReportResponse } from '../../../domain/dtos/reports/quotes-unattended-report-response'
import { ReportsRepository } from '../../../domain/repositories/reports.repository'

export class GetQuotesUnattendedReportUseCase {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  execute(dto: QuotesUnattendedReportDto): Promise<QuotesUnattendedReportResponse> {
    return this.reportsRepository.getQuotesUnattendedReport(dto)
  }
}
