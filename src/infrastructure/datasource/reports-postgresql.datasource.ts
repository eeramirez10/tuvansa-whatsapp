import { Prisma, PrismaClient, QuoteWorkflowStatus } from "@prisma/client";
import { ReportsDatasource } from "../../domain/datasource/reports.datasource";
import { QuotesByBranchReportResponse } from "../../domain/dtos/reports/quotes-by-branch-report-response";
import { QuotesByBranchReportDto } from "../../domain/dtos/reports/quotes-by-branch-report.dto";
import { QuotesByBranchStatusReportResponse } from "../../domain/dtos/reports/quotes-by-branch-status-report-response";
import { QuotesByBranchStatusReportDto } from "../../domain/dtos/reports/quotes-by-branch-status-report.dto";



const prisma = new PrismaClient()

const WORKFLOW_STATUSES: QuoteWorkflowStatus[] = [
  QuoteWorkflowStatus.NEW,
  QuoteWorkflowStatus.VIEWED,
  QuoteWorkflowStatus.DOWNLOADED,
  QuoteWorkflowStatus.IN_PROGRESS,
  QuoteWorkflowStatus.QUOTED,
  QuoteWorkflowStatus.REJECTED,
  QuoteWorkflowStatus.INVOICED
];

export class ReportsPostgresqlDataSource extends ReportsDatasource {
  async getQuotesByBranch(dto: QuotesByBranchReportDto): Promise<QuotesByBranchReportResponse> {
    const where = this.buildQuoteWhere(dto)

    const grouped = await prisma.quote.groupBy({
      by: ["branchId"],
      where,
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          branchId: "desc"
        }
      }
    });

    const total = grouped.reduce((sum, item) => sum + item._count._all, 0)

    const branchsIds = grouped.map((item) => item.branchId).filter(Boolean) as string[]

    const uniqueBranchIds = [...new Set(branchsIds)]



    const branches = await prisma.branch.findMany({
      where: {
        id: {
          in: uniqueBranchIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const branchesNames = uniqueBranchIds.length === 0 ? new Map<string, string>() : new Map(branches.map((branch) => [branch.id, branch.name]))


    return {
      total,
      items: grouped.map((item) => ({
        branchId: item.branchId,
        branchName: item.branchId ? branchesNames.get(item.branchId) ?? 'BranchOffice not found' : 'Sin sucursal',
        totalQuotes: item._count._all,
        percentage: total > 0
          ? Number(((item._count._all / total) * 100).toFixed(2)) : 0
      }))
    }

  }


  async getQuotesByBranchStatus(dto: QuotesByBranchStatusReportDto): Promise<QuotesByBranchStatusReportResponse> {
    const where = this.buildQuoteWhere(dto)

    const grouped = await prisma.quote.groupBy({
      by: ["branchId", "workflowStatus"],
      where,
      _count: {
        _all: true
      },
      orderBy: [
        {
          branchId: "asc"
        },
        {
          workflowStatus: "asc"
        }
      ]
    });

    const branchsIds = grouped.map((item) => item.branchId).filter(Boolean) as string[]

    const uniqueBranchIds = [...new Set(branchsIds)]



    const branches = await prisma.branch.findMany({
      where: {
        id: {
          in: uniqueBranchIds
        }
      },
      select: {
        id: true,
        name: true
      }
    })

    const branchNames = uniqueBranchIds.length === 0 ? new Map<string, string>() : new Map(branches.map((branch) => [branch.id, branch.name]))


    const reportByBranch = new Map<string, {
      branchId: string | null;
      branchName: string;
      totalQuotes: number;
      statuses: Record<QuoteWorkflowStatus, number>;
    }>();

    for (const item of grouped) {
      const key = item.branchId ?? "NO_BRANCH"

      if (!reportByBranch.has(key)) {
        reportByBranch.set(key, {
          branchId: item.branchId,
          branchName: item.branchId
            ? branchNames.get(item.branchId) ?? "Sucursal no encontrada"
            : "Sin sucursal",
          totalQuotes: 0,
          statuses: WORKFLOW_STATUSES.reduce((acc, status) => {
            acc[status] = 0;
            return acc;
          }, {} as Record<QuoteWorkflowStatus, number>)
        })
      }

      const branchReport = reportByBranch.get(key);
      if (!branchReport) continue;

      branchReport.totalQuotes += item._count._all;
      branchReport.statuses[item.workflowStatus]= item._count._all;
    }

    return {
      items: Array.from(reportByBranch.values())
    }





  }

  private buildQuoteWhere(
    dto: QuotesByBranchReportDto | QuotesByBranchStatusReportDto
  ): Prisma.QuoteWhereInput {
    const where: Prisma.QuoteWhereInput = {}

    if (dto.startDate && dto.endDate) {
      where.createdAt = {
        gte: new Date(dto.startDate),
        lt: new Date(dto.endDate)
      }
    }

    if (dto.branchId) {
      where.branchId = dto.branchId
    }

    if ("workflowStatus" in dto && dto.workflowStatus) {
      where.workflowStatus = dto.workflowStatus;
    }

    return where
  }





}
