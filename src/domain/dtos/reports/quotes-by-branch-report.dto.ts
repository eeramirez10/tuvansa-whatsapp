import { QuoteWorkflowStatus } from "@prisma/client";
import { PaginationDto } from "../pagination-dto";

interface Options {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  workflowStatus?: string;
}

export class QuotesByBranchReportDto {

  startDate?: string;
  endDate?: string;
  branchId?: string
  workflowStatus?: QuoteWorkflowStatus

  constructor(options: Options) {
    this.startDate = options.startDate;
    this.endDate = options.endDate;
    this.branchId = options.branchId;
    this.workflowStatus = options.workflowStatus as QuoteWorkflowStatus;
  }

  static execute(values: Record<any, any>): [string?, QuotesByBranchReportDto?] {

    const [error, paginationDto] = PaginationDto.execute(values);

    if (error || !paginationDto) return [error];

    const branchId = values.branchId ? String(values.branchId) : undefined;

    const workflowStatusRaw = values.workflowStatus;
    let workflowStatus: QuoteWorkflowStatus | undefined;

    if (workflowStatusRaw !== undefined) {

      const normalizedStatus = String(workflowStatusRaw).toUpperCase()

      const validStatuses = new Set<QuoteWorkflowStatus>([
        QuoteWorkflowStatus.NEW,
        QuoteWorkflowStatus.VIEWED,
        QuoteWorkflowStatus.DOWNLOADED,
        QuoteWorkflowStatus.IN_PROGRESS,
        QuoteWorkflowStatus.QUOTED,
        QuoteWorkflowStatus.REJECTED,
        QuoteWorkflowStatus.INVOICED
      ])

      if(!validStatuses.has(normalizedStatus as QuoteWorkflowStatus)){
        return ['invalid workflowStatus']
      }

      workflowStatus = normalizedStatus as QuoteWorkflowStatus
    }

    return [
      undefined,
      new QuotesByBranchReportDto({
        startDate:paginationDto.startDate,
        endDate:paginationDto.endDate,
        branchId,
        workflowStatus
      })
    ]
  }

}
