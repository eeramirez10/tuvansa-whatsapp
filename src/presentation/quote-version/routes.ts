import { Router } from "express";
import { QuotePostgresqlDatasource } from "../../infrastructure/datasource/quote-postgresql.datasource";
import { QuoteRepositoryImpl } from "../../infrastructure/repositories/quote.repository-impl";

import { OpenAiFunctinsService } from "../../infrastructure/services/openai-functions.service";
import { QuoteVersionPostgresqlDatasource } from "../../infrastructure/datasource/quote-version-postgresql.datasource.dto";
import { QuoteVersionRepositoryImpl } from '../../infrastructure/repositories/quote-version.repository-impl';
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { QuoteVersionsController } from "./controller";
import { QuoteArtifactPostgresql } from '../../infrastructure/datasource/quote-artifact-postgresql.datasource';
import { QuoteArtifactRepositoryImpl } from "../../infrastructure/repositories/quote-artifact-repository-impl";
import { ReactPuppeteerPdfRenderer } from "../../infrastructure/template/renderer/ReactPuppeteerPdfRenderer";
import { resolve } from "path";
import { readFileSync } from "fs";
import { S3FileStorageService } from "../../infrastructure/services/s3-file-storage.service";
import { MessageService } from "../../domain/services/message.service";
import { TwilioService } from "../../infrastructure/services/twilio.service";
import { WhatsAppNotificationService } from '../../infrastructure/services/whatsapp-notification.service';



export class QuotesVersionRoutes {

  static routes(): Router {

    const router = Router()

    const quoteVersionDatasource = new QuoteVersionPostgresqlDatasource()
    const quoteVersionRepositoryImpl = new QuoteVersionRepositoryImpl(quoteVersionDatasource);

    const quoteArtifactDatasource = new QuoteArtifactPostgresql()
    const quoteArtifactRepositoryImpl = new QuoteArtifactRepositoryImpl(quoteArtifactDatasource);

    // Logo opcional como data URL (si no lo pasas por env)
    const logoPath = resolve(process.cwd(), 'src/infrastructure/assets/logo-tuvansa.png');
    let logoDataUrl: string | undefined = undefined;
    try {
      const buf = readFileSync(logoPath);
      logoDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
    } catch {
      // silencioso si no existe, puedes dejarlo undefined
    }

    const pdfRenderer = new ReactPuppeteerPdfRenderer(
      {
        name: 'Tubería y Válvulas del Norte S.A. de C.V. (TUVANSA)',
        logoUrl: logoDataUrl,
        addressLines: [
          'Cda. San Buenaventura #12,',
          'Industrial San Buenaventura,',
          '54135 Tlalnepantla, Méx.'
        ],
        phone: '(55) 50 39 07 30',
        website: 'www.tuvansa.com.mx',
      },
      { formCode: 'TF-VT-01', agentName: 'Nombre Agente' },
      { showBorders: true }
    )

    const storageService = new S3FileStorageService()
    const messageService = new TwilioService()
    const whatsAppNotificationService = new WhatsAppNotificationService(messageService)


    const controller = new QuoteVersionsController(
      quoteArtifactRepositoryImpl,
      quoteVersionRepositoryImpl,
      pdfRenderer,
      storageService,
      messageService,
      whatsAppNotificationService
    )


    router.post('/:id/artifacts/pdf', AuthMiddleware.validateJWT, controller.generatePdfArtifact);
    router.post('/:id/concluide', AuthMiddleware.validateJWT, controller.concluideQuoteVersion);

    router.post('/send-quote-pdf', controller.sendQuotePdf);


    router.get('/:id/artifacts/pdf/latest', controller.getLatestPdfArtifact);
    router.get('/:quoteId/draft', controller.getDraftByQuote);


    return router
  }
}