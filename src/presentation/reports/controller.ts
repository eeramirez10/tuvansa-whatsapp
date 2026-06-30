import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { ReportsRepository } from '../../domain/repositories/reports.repository';
import { QuotesByBranchReportDto } from '../../domain/dtos/reports/quotes-by-branch-report.dto';
import { GetQuotesByBranchReportUseCase } from '../../application/use-cases/reports/get-quotes-by-branch-report.use-case';
import { QuotesByBranchStatusReportDto } from '../../domain/dtos/reports/quotes-by-branch-status-report.dto';
import { GetQuotesByBranchStatusReportUseCase } from '../../application/use-cases/reports/get-quotes-by-branch-status-report.use-case';
import { QuotesExecutiveReportDto } from '../../domain/dtos/reports/quotes-executive-report.dto';
import { GetQuotesExecutiveReportUseCase } from '../../application/use-cases/reports/get-quotes-executive-report.use-case';

export class ReportsController {
  constructor(private readonly reportsRepository: ReportsRepository) {}

  getQuotesByBranchReport = (req: Request, res: Response) => {
    const [error, dto] = QuotesByBranchReportDto.execute({ ...req.query });

    if (error || !dto) {
      res.status(400).json({ error });
      return;
    }

    new GetQuotesByBranchReportUseCase(this.reportsRepository)
      .execute(dto)
      .then((resp) => {
        res.json(resp);
      })
      .catch((e) => {
        console.log(e);
        res.status(500).json({ error: 'Hubo un error' });
      });
  };

  getQuotesByBranchStatus = (req: Request, res: Response, next: NextFunction) => {
    const [error, dto] = QuotesByBranchStatusReportDto.execute({ ...req.query });

    if (error || !dto) {
      res.status(400).json({ error });
      return;
    }

    new GetQuotesByBranchStatusReportUseCase(this.reportsRepository)
      .execute(dto)
      .then((report) => {
        res.json(report);
      })
      .catch((e) => {
        console.log(e);
        res.status(500).json({ error: 'Hubo un error' });
      });
  };

  getQuotesExecutiveReport = (req: Request, res: Response) => {
    const user = req.body.user;
    const [error, dto] = QuotesExecutiveReportDto.execute({ ...req.query });

    if (error || !dto) {
      res.status(400).json({ error });
      return;
    }

    if (!this.isAdmin(user)) {
      const allowedBranchIds = this.getUserBranchIds(user);
      if (allowedBranchIds.length === 0) {
        res.status(403).json({ error: 'No tienes sucursales asignadas' });
        return;
      }

      if (dto.branchId && !allowedBranchIds.includes(dto.branchId)) {
        res.status(403).json({ error: 'No tienes permiso para consultar esa sucursal' });
        return;
      }

      dto.branchIds = dto.branchId ? [dto.branchId] : allowedBranchIds;
    }

    new GetQuotesExecutiveReportUseCase(this.reportsRepository)
      .execute(dto)
      .then((report) => {
        res.json(report);
      })
      .catch((e) => {
        console.log(e);
        res.status(500).json({ error: 'Hubo un error' });
      });
  };

  private isAdmin(user: any): boolean {
    return `${user?.role ?? ''}`.toUpperCase() === UserRole.ADMIN;
  }

  private getUserBranchIds(user: any): string[] {
    const branchIds = Array.isArray(user?.branchIds) ? user.branchIds : [];
    return branchIds
      .map((value: unknown) => `${value ?? ''}`.trim())
      .filter(Boolean)
      .filter((value: string, index: number, values: string[]) => values.indexOf(value) === index);
  }
}
