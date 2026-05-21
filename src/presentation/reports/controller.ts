import { NextFunction, Request, Response } from 'express';
import { ReportsRepository } from '../../domain/repositories/reports.repository';
import { QuotesByBranchReportDto } from '../../domain/dtos/reports/quotes-by-branch-report.dto';
import { GetQuotesByBranchReportUseCase } from '../../application/use-cases/reports/get-quotes-by-branch-report.use-case';
import { QuotesByBranchStatusReportDto } from '../../domain/dtos/reports/quotes-by-branch-status-report.dto';
import { GetQuotesByBranchStatusReportUseCase } from '../../application/use-cases/reports/get-quotes-by-branch-status-report.use-case';


export class ReportsController {

  constructor(private readonly reportsRepository: ReportsRepository) { }


  getQuotesByBranchReport = (req: Request, res: Response) => {

    const [error, dto] = QuotesByBranchReportDto.execute({ ...req.query });

    if (error || !dto) {

      res.status(400).json({ error })

      return
    }


    new GetQuotesByBranchReportUseCase(this.reportsRepository)
      .execute(dto)
      .then((resp) => {
        res.json(resp)
      })
      .catch((error) => {
        console.log(error)
        res.status(500).json({ error: "Hubo un error" });
      })


  }

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
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Hubo un error" });
      });
  };

}
