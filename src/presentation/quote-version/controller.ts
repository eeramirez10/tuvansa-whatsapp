import { Request, Response } from 'express';
import { QuoteVersionRepository } from '../../domain/repositories/quote-version.repository';
import { GenerateQuotePdfAndStoreArtifact } from '../../application/use-cases/quote-artifact/generate-quote-pdf-and-store-artifact';
import { QuoteArtifactRepository } from '../../domain/repositories/quote-artifact.repository';
import { PdfRenderer } from '../../domain/ports/pdf-renderer';
import { FileStorageService } from '../../domain/services/file-storage.service';
import { VersionStatus } from '@prisma/client';
import { SendQuoteToCustomerSessionUseCase } from '../../application/use-cases/whatsApp/send-quote-to-customer-session.use-case';
import { MessageService } from '../../domain/services/message.service';
import { WhatsAppNotificationService } from '../../infrastructure/services/whatsapp-notification.service';


export class QuoteVersionsController {

  constructor(
    private readonly quoteArtifactRepository: QuoteArtifactRepository,
    private readonly quoteVersionRepository: QuoteVersionRepository,
    private readonly pdf: PdfRenderer,
    private readonly storage: FileStorageService,
    private readonly messageService: MessageService,
    private readonly whatsAppNotificationService: WhatsAppNotificationService
  ) {

  }

  generatePdfArtifact = async (req: Request, res: Response) => {
    try {
      const quoteVersionId = req.params.id;
      if (!quoteVersionId) {
        res.status(400).json({ ok: false, error: 'Missing quoteVersionId' });
        return
      }

      const watermarkDraft = req.query.draft === '1' || req.query.draft === 'true';
      const regenerate = req.query.regenerate === '1' || req.query.regenerate === 'true';
      const presignSec = req.query.presign ? Number(req.query.presign) : 1800;

      const out = await new GenerateQuotePdfAndStoreArtifact(
        this.quoteArtifactRepository,
        this.quoteVersionRepository,
        this.pdf,
        this.storage,
      ).execute({
        quoteVersionId, opts: {
          watermarkDraft,
          regenerate,
          presignSeconds: presignSec,
        }
      });


      res.status(201).json({
        ok: true,
        data: {
          artifactId: out.artifactId,
          fileKey: out.storageKey,
          mimeType: 'application/pdf',
          checksum: out.checksumSha256,
          sizeBytes: out.sizeBytes,
          presignedUrl: out.presignedUrl,
          expiresIn: presignSec,
        },
      });


    } catch (err: any) {
      console.error('[generatePdfArtifact] error:', err);
      res.status(400).json({ ok: false, error: err?.message ?? 'Unknown error' });
    }
  };


  // GET /quote-versions/:id/artifacts/pdf/latest?presign=1800
  // Devuelve el último artifact PDF (si existe) y un presigned URL.
  getLatestPdfArtifact = async (req: Request, res: Response) => {
    try {
      const quoteVersionId = req.params.id;
      if (!quoteVersionId) {
        res.status(400).json({ ok: false, error: 'Missing quoteVersionId' });
        return
      }

      const presignSec = req.query.presign ? Number(req.query.presign) : 900;

      const artifact = await this.quoteArtifactRepository.findLatestPdfArtifact(quoteVersionId);

      if (!artifact) {
        res.status(404).json({ ok: false, error: 'No PDF artifact found for this version' });
        return
      }

      const url = await this.storage.generatePresignedUrl(artifact.fileKey, presignSec);

      res.json({
        ok: true,
        data: {
          artifactId: artifact.id,
          fileKey: artifact.fileKey,
          checksum: artifact.checksum ?? null,
          createdAt: artifact.createdAt,
          presignedUrl: url,
          expiresIn: presignSec,
        },
      });
    } catch (err: any) {
      console.error('[getLatestPdfArtifact] error:', err);
      res.status(400).json({ ok: false, error: err?.message ?? 'Unknown error' });
    }
  };

  getDraftByQuote = async (req: Request, res: Response) => {

    try {
      const quoteId = req.params.quoteId;

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

    const quoteVersionId = req.params.id;
    if (!quoteVersionId) {
      res.status(400).json({ ok: false, error: 'Missing quoteVersionId' });
      return
    }

    try {
      const watermarkDraft = req.query.draft === '1' || req.query.draft === 'true';
      const regenerate = req.query.regenerate === '1' || req.query.regenerate === 'true';
      const presignSec = req.query.presign ? Number(req.query.presign) : 1800;

      await this.quoteVersionRepository.updateStatus(quoteVersionId, VersionStatus.FINAL)



      const out = await new GenerateQuotePdfAndStoreArtifact(
        this.quoteArtifactRepository,
        this.quoteVersionRepository,
        this.pdf,
        this.storage,
      ).execute({
        quoteVersionId, opts: {
          watermarkDraft,
          regenerate,
          presignSeconds: presignSec,
        }
      });


      res.status(201).json({
        ok: true,
        data: {
          artifactId: out.artifactId,
          fileKey: out.storageKey,
          mimeType: 'application/pdf',
          checksum: out.checksumSha256,
          sizeBytes: out.sizeBytes,
          presignedUrl: out.presignedUrl,
          expiresIn: presignSec,
        },
      });

    } catch (error) {

      console.log(error, '[concluideQuoteVersion]')
    }



  }

  sendQuotePdf = async (req: Request, res: Response) => {


    const {
      quoteVersionId,
      artifactId,
    } = req.body



    try {

      if (!quoteVersionId) {

        res.status(400).json({
          error: 'quoteVersionId es requerido'
        })
        return
      }

      const sendQuoteToCustomerSessionUseCase = new
        SendQuoteToCustomerSessionUseCase(
          this.messageService,
          this.storage,
          this.whatsAppNotificationService
        )

      const sendResp = await sendQuoteToCustomerSessionUseCase.execute({ quoteVersionId, artifactId })



      res.json({ ...sendResp })




    } catch (err) {
      console.error('[sendQuotePdf] error:', err)
      res.status(500).json({
        error: 'No se pudo enviar el PDF por WhatsApp',
        details: err?.message ?? String(err),
      })
    }


  }



}