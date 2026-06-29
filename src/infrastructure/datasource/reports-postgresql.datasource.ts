import { Prisma, PrismaClient, QuoteWorkflowStatus } from "@prisma/client";
import { ReportsDatasource } from "../../domain/datasource/reports.datasource";
import { QuotesByBranchReportResponse } from "../../domain/dtos/reports/quotes-by-branch-report-response";
import { QuotesByBranchReportDto } from "../../domain/dtos/reports/quotes-by-branch-report.dto";
import { QuotesByBranchStatusReportResponse } from "../../domain/dtos/reports/quotes-by-branch-status-report-response";
import { QuotesByBranchStatusReportDto } from "../../domain/dtos/reports/quotes-by-branch-status-report.dto";
import {
  QuotesExecutiveReportResponse,
  QuotesExecutiveRejectedTypeRow,
  QuotesExecutiveTopBranch
} from "../../domain/dtos/reports/quotes-executive-report-response";
import { QuotesExecutiveReportDto } from "../../domain/dtos/reports/quotes-executive-report.dto";

const prisma = new PrismaClient();

const WORKFLOW_STATUSES: QuoteWorkflowStatus[] = [
  QuoteWorkflowStatus.NEW,
  QuoteWorkflowStatus.VIEWED,
  QuoteWorkflowStatus.DOWNLOADED,
  QuoteWorkflowStatus.IN_PROGRESS,
  QuoteWorkflowStatus.QUOTED,
  QuoteWorkflowStatus.REJECTED,
  QuoteWorkflowStatus.INVOICED
];

const ATTENDED_STATUSES = new Set<QuoteWorkflowStatus>([
  QuoteWorkflowStatus.VIEWED,
  QuoteWorkflowStatus.IN_PROGRESS,
  QuoteWorkflowStatus.QUOTED,
  QuoteWorkflowStatus.REJECTED,
  QuoteWorkflowStatus.INVOICED
]);

const BACKLOG_STATUSES = new Set<QuoteWorkflowStatus>([
  QuoteWorkflowStatus.NEW,
  QuoteWorkflowStatus.IN_PROGRESS
]);

const MONTH_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export class ReportsPostgresqlDataSource extends ReportsDatasource {
  async getQuotesByBranch(dto: QuotesByBranchReportDto): Promise<QuotesByBranchReportResponse> {
    const where = this.buildQuoteWhere(dto);

    const grouped = await prisma.quote.groupBy({
      by: ['branchId'],
      where,
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          branchId: 'desc'
        }
      }
    });

    const total = grouped.reduce((sum, item) => sum + item._count._all, 0);
    const branchIds = grouped.map((item) => item.branchId).filter(Boolean) as string[];
    const branchNames = await this.getBranchNames(branchIds);

    return {
      total,
      items: grouped.map((item) => ({
        branchId: item.branchId,
        branchName: item.branchId ? branchNames.get(item.branchId) ?? 'Sucursal no encontrada' : 'Sin sucursal',
        totalQuotes: item._count._all,
        percentage: total > 0 ? Number(((item._count._all / total) * 100).toFixed(2)) : 0
      }))
    };
  }

  async getQuotesByBranchStatus(dto: QuotesByBranchStatusReportDto): Promise<QuotesByBranchStatusReportResponse> {
    const where = this.buildQuoteWhere(dto);

    const grouped = await prisma.quote.groupBy({
      by: ['branchId', 'workflowStatus'],
      where,
      _count: {
        _all: true
      },
      orderBy: [{ branchId: 'asc' }, { workflowStatus: 'asc' }]
    });

    const branchIds = grouped.map((item) => item.branchId).filter(Boolean) as string[];
    const branchNames = await this.getBranchNames(branchIds);

    const reportByBranch = new Map<string, {
      branchId: string | null;
      branchName: string;
      totalQuotes: number;
      statuses: Record<QuoteWorkflowStatus, number>;
    }>();

    for (const item of grouped) {
      const key = item.branchId ?? 'NO_BRANCH';

      if (!reportByBranch.has(key)) {
        reportByBranch.set(key, {
          branchId: item.branchId,
          branchName: item.branchId ? branchNames.get(item.branchId) ?? 'Sucursal no encontrada' : 'Sin sucursal',
          totalQuotes: 0,
          statuses: this.emptyStatuses()
        });
      }

      const branchReport = reportByBranch.get(key);
      if (!branchReport) continue;

      branchReport.totalQuotes += item._count._all;
      branchReport.statuses[item.workflowStatus] = item._count._all;
    }

    return {
      items: Array.from(reportByBranch.values())
    };
  }

  async getQuotesExecutiveReport(dto: QuotesExecutiveReportDto): Promise<QuotesExecutiveReportResponse> {
    const yearStart = new Date(Date.UTC(dto.year, 0, 1, 0, 0, 0, 0));
    const yearEnd = new Date(Date.UTC(dto.year + 1, 0, 1, 0, 0, 0, 0));

    const where: Prisma.QuoteWhereInput = {
      createdAt: {
        gte: yearStart,
        lt: yearEnd
      }
    };

    if (dto.branchId) {
      where.branchId = dto.branchId;
    } else if (Array.isArray(dto.branchIds) && dto.branchIds.length > 0) {
      where.branchId = { in: dto.branchIds };
    }

    const quotes = await prisma.quote.findMany({
      where,
      select: {
        createdAt: true,
        workflowStatus: true,
        rejectedReason: true,
        branchId: true
      }
    });

    const branchIds = [...new Set(quotes.map((item) => item.branchId).filter(Boolean))] as string[];
    const branchNames = await this.getBranchNames(branchIds);

    const monthly = MONTH_LABELS.map((label, index) => ({
      month: index + 1,
      label,
      totalRequests: 0,
      attendedRequests: 0,
      attentionRate: 0,
      inProgress: 0,
      quoted: 0,
      rejected: 0,
      invoiced: 0
    }));

    const rejectedByType = new Map<string, number>();
    const rejectedByTypeMonthly = new Map<number, Map<string, number>>();

    const branchAggregate = new Map<string, {
      branchId: string | null;
      branchName: string;
      totalRequests: number;
      attendedRequests: number;
      backlog: number;
    }>();

    for (const quote of quotes) {
      const month = quote.createdAt.getUTCMonth() + 1;
      const monthlyRow = monthly[month - 1];
      monthlyRow.totalRequests += 1;

      if (ATTENDED_STATUSES.has(quote.workflowStatus)) {
        monthlyRow.attendedRequests += 1;
      }

      if (quote.workflowStatus === QuoteWorkflowStatus.IN_PROGRESS) monthlyRow.inProgress += 1;
      if (quote.workflowStatus === QuoteWorkflowStatus.QUOTED) monthlyRow.quoted += 1;
      if (quote.workflowStatus === QuoteWorkflowStatus.REJECTED) {
        monthlyRow.rejected += 1;
        const rejectType = this.normalizeRejectType(quote.rejectedReason);

        rejectedByType.set(rejectType, (rejectedByType.get(rejectType) ?? 0) + 1);

        if (!rejectedByTypeMonthly.has(month)) {
          rejectedByTypeMonthly.set(month, new Map<string, number>());
        }

        const monthMap = rejectedByTypeMonthly.get(month)!;
        monthMap.set(rejectType, (monthMap.get(rejectType) ?? 0) + 1);
      }
      if (quote.workflowStatus === QuoteWorkflowStatus.INVOICED) monthlyRow.invoiced += 1;

      const branchKey = quote.branchId ?? 'NO_BRANCH';
      if (!branchAggregate.has(branchKey)) {
        branchAggregate.set(branchKey, {
          branchId: quote.branchId,
          branchName: quote.branchId ? branchNames.get(quote.branchId) ?? 'Sucursal no encontrada' : 'Sin sucursal',
          totalRequests: 0,
          attendedRequests: 0,
          backlog: 0
        });
      }

      const branch = branchAggregate.get(branchKey)!;
      branch.totalRequests += 1;
      if (ATTENDED_STATUSES.has(quote.workflowStatus)) branch.attendedRequests += 1;
      if (BACKLOG_STATUSES.has(quote.workflowStatus)) branch.backlog += 1;
    }

    for (const row of monthly) {
      row.attentionRate = this.toPercent(row.attendedRequests, row.totalRequests);
    }

    const totalRequests = monthly.reduce((sum, row) => sum + row.totalRequests, 0);
    const attendedRequests = monthly.reduce((sum, row) => sum + row.attendedRequests, 0);
    const quoted = monthly.reduce((sum, row) => sum + row.quoted, 0);
    const rejected = monthly.reduce((sum, row) => sum + row.rejected, 0);
    const invoiced = monthly.reduce((sum, row) => sum + row.invoiced, 0);
    const inProgress = monthly.reduce((sum, row) => sum + row.inProgress, 0);

    const branches = Array.from(branchAggregate.values());

    const topBranchByRequests = this.pickTopBranch(
      branches,
      (item) => item.totalRequests
    );

    const topBranchByAttentionRate = this.pickTopBranch(
      branches.filter((item) => item.totalRequests > 0),
      (item) => this.toPercent(item.attendedRequests, item.totalRequests)
    );

    const topBranchByBacklog = this.pickTopBranch(
      branches,
      (item) => item.backlog
    );

    const rejectedTotal = rejected;
    const rejectedByTypeRows: QuotesExecutiveRejectedTypeRow[] = Array.from(rejectedByType.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: this.toPercent(count, rejectedTotal)
      }))
      .sort((a, b) => b.count - a.count);

    const rejectedByTypeMonthlyRows = monthly.map((row) => {
      const monthTypeMap = rejectedByTypeMonthly.get(row.month) ?? new Map<string, number>();
      const monthRejectedTotal = Array.from(monthTypeMap.values()).reduce((sum, value) => sum + value, 0);

      return {
        month: row.month,
        label: row.label,
        items: Array.from(monthTypeMap.entries())
          .map(([type, count]) => ({
            type,
            count,
            percentage: this.toPercent(count, monthRejectedTotal)
          }))
          .sort((a, b) => b.count - a.count)
      };
    });

    return {
      year: dto.year,
      generatedAt: new Date().toISOString(),
      kpis: {
        totalRequests,
        attendedRequests,
        attentionRate: this.toPercent(attendedRequests, totalRequests),
        quoted,
        rejected,
        invoiced,
        inProgress,
        topBranchByRequests,
        topBranchByAttentionRate,
        topBranchByBacklog
      },
      monthly,
      rejectedByType: rejectedByTypeRows,
      rejectedByTypeMonthly: rejectedByTypeMonthlyRows
    };
  }

  private buildQuoteWhere(dto: QuotesByBranchReportDto | QuotesByBranchStatusReportDto): Prisma.QuoteWhereInput {
    const where: Prisma.QuoteWhereInput = {};

    if (dto.startDate && dto.endDate) {
      where.createdAt = {
        gte: new Date(dto.startDate),
        lt: new Date(dto.endDate)
      };
    }

    if (dto.branchId) {
      where.branchId = dto.branchId;
    }

    if ('workflowStatus' in dto && dto.workflowStatus) {
      where.workflowStatus = dto.workflowStatus;
    }

    return where;
  }

  private async getBranchNames(branchIds: string[]): Promise<Map<string, string>> {
    const uniqueBranchIds = [...new Set(branchIds)];
    if (uniqueBranchIds.length === 0) return new Map<string, string>();

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
    });

    return new Map(branches.map((branch) => [branch.id, branch.name]));
  }

  private emptyStatuses(): Record<QuoteWorkflowStatus, number> {
    return WORKFLOW_STATUSES.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<QuoteWorkflowStatus, number>);
  }

  private toPercent(value: number, total: number): number {
    if (total <= 0) return 0;
    return Number(((value / total) * 100).toFixed(2));
  }

  private normalizeRejectType(reason?: string | null): string {
    const raw = `${reason ?? ''}`.trim();
    if (!raw) return 'SIN_MOTIVO';

    const normalized = raw.toLowerCase();

    if (normalized.includes('precio') || normalized.includes('caro')) return 'PRECIO';
    if (normalized.includes('tiempo') || normalized.includes('entrega') || normalized.includes('demora')) return 'TIEMPO_ENTREGA';
    if (normalized.includes('stock') || normalized.includes('inventario') || normalized.includes('existencia')) return 'SIN_STOCK';
    if (normalized.includes('no responde') || normalized.includes('sin respuesta')) return 'CLIENTE_NO_RESPONDE';
    if (normalized.includes('cancel')) return 'CANCELADO_CLIENTE';

    return raw.toUpperCase().slice(0, 60);
  }

  private pickTopBranch(
    branches: Array<{ branchId: string | null; branchName: string; totalRequests: number; attendedRequests: number; backlog: number }>,
    selector: (branch: { branchId: string | null; branchName: string; totalRequests: number; attendedRequests: number; backlog: number }) => number
  ): QuotesExecutiveTopBranch | null {
    if (branches.length === 0) return null;

    let top = branches[0];
    let topValue = selector(top);

    for (let index = 1; index < branches.length; index += 1) {
      const value = selector(branches[index]);
      if (value > topValue) {
        top = branches[index];
        topValue = value;
      }
    }

    return {
      branchId: top.branchId,
      branchName: top.branchName,
      value: Number(topValue.toFixed(2))
    };
  }
}
