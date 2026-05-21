import { QuotesByBranchReportDto } from '../../../domain/dtos/reports/quotes-by-branch-report.dto';
import { QuotesByBranchReportResponse } from '../../../domain/dtos/reports/quotes-by-branch-report-response';
import { ReportsRepository } from '../../../domain/repositories/reports.repository';
export class GetQuotesByBranchReportUseCase {

  constructor(private readonly reportsRepository:ReportsRepository){

  }

  execute (dto:QuotesByBranchReportDto): Promise<QuotesByBranchReportResponse> {

    return this.reportsRepository.getQuotesByBranch(dto);

  }
}
