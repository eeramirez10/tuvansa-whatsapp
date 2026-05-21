
import { PaginationDto } from "../pagination-dto";

interface Options {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export class QuotesByBranchStatusReportDto {
  startDate?: string;
  endDate?: string;
  branchId?: string;

  constructor(options: Options) {
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.branchId = options.branchId;
  }

  static execute(values: Record<any, any>): [string?, QuotesByBranchStatusReportDto?] {
    const [error, pagination] = PaginationDto.execute(values);
    if (error || !pagination) return [error];

    const branchId = values.branchId ? String(values.branchId) : undefined;

    return [
      undefined,
      new QuotesByBranchStatusReportDto({
        startDate: pagination.startDate,
        endDate: pagination.endDate,
        branchId
      })
    ];
  }
}
