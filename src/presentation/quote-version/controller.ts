import { Request, Response } from 'express';
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository';
import { VersionStatus } from '@prisma/client';


export class QuoteVersionsController {

  constructor(
    private readonly quoteVersionRepository: QuoteVersionRepository
  ) {

  }

  getDraftByQuote = async (req: Request, res: Response) => {

    try {
      const quoteId = req.params.quoteId as string;

      if (!quoteId) {
        res.status(400).json({
          error: 'quote id is required'
        })
        return
      }

      const draft = await this.quoteVersionRepository.getDraftByQuote(quoteId);

      res.json({
        ...draft
      })

      return


    } catch (error) {
      console.log(error)

      if (error instanceof Error) {

        res.status(500).json({
          error: {
            message: error.message,
            name: error.name

          }
        })
      }

    }

  }

  concluideQuoteVersion = async (req: Request, res: Response) => {

    const quoteVersionId = req.params.id as string
    if (!quoteVersionId) {
      res.status(400).json({ ok: false, error: 'Missing quoteVersionId' });
      return
    }

    try {
      await this.quoteVersionRepository.updateStatus(quoteVersionId, VersionStatus.FINAL)

      res.status(200).json({
        ok: true,
        data: {
          quoteVersionId,
          status: VersionStatus.FINAL
        }
      });

    } catch (error) {

      console.log(error, '[concluideQuoteVersion]')
      res.status(500).json({
        ok: false,
        error: 'No se pudo concluir la versión de cotización'
      })
    }



  }

}
