import { QuoteWorkflowStatus } from "@prisma/client";
import { PaginationDto } from "../pagination-dto";

interface Options {
  page?: string;
  pageSize?: string;
  startDate?: string;
  endDate?: string;
  workflowStatus?: string;
  branchId?: string;
  branchIds?: string[];
}

export class GetQuotesDto extends PaginationDto {
  workflowStatus?: QuoteWorkflowStatus;
  branchId?: string;
  branchIds?: string[];

  constructor(options: Options) {
    super(options);
    this.workflowStatus = options.workflowStatus as QuoteWorkflowStatus | undefined;
    this.branchId = options.branchId;
    this.branchIds = options.branchIds;
  }

  static execute(values: Record<any, any>): [string?, GetQuotesDto?] {
    const [error, pagination] = PaginationDto.execute(values);
    if (error || !pagination) return [error];

    const workflowStatusRaw = values.workflowStatus;
    if (workflowStatusRaw !== undefined) {
      const workflowStatus = String(workflowStatusRaw).toUpperCase();
      const validStatuses = new Set<QuoteWorkflowStatus>([
        QuoteWorkflowStatus.NEW,
        QuoteWorkflowStatus.VIEWED,
        QuoteWorkflowStatus.DOWNLOADED,
        QuoteWorkflowStatus.IN_PROGRESS,
        QuoteWorkflowStatus.QUOTED,
        QuoteWorkflowStatus.REJECTED,
        QuoteWorkflowStatus.INVOICED
      ]);

      if (!validStatuses.has(workflowStatus as QuoteWorkflowStatus)) {
        return ['workflowStatus inválido'];
      }
    }

    const branchId = values.branchId ? String(values.branchId) : undefined;
    const branchIds = Array.isArray(values.branchIds)
      ? [...new Set(values.branchIds.map((value) => String(value)).filter(Boolean))]
      : undefined;

    return [undefined, new GetQuotesDto({
      page: String(pagination.page ?? 1),
      pageSize: String(pagination.pageSize ?? 10),
      startDate: pagination.startDate,
      endDate: pagination.endDate,
      workflowStatus: workflowStatusRaw ? String(workflowStatusRaw).toUpperCase() : undefined,
      branchId,
      branchIds
    })];
  }
}
