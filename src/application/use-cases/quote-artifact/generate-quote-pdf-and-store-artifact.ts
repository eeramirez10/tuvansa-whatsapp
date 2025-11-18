import { QuoteArtifactRepository } from '../../../domain/repositories/quote-artifact.repository';
import { PdfRenderer } from '../../../domain/ports/pdf-renderer';
import { FileStorageService } from '../../../domain/services/file-storage.service';
import { QuoteVersionRepository } from '../../../domain/repositories/quote-version.repository';
import crypto from 'crypto'
interface Option {
  quoteVersionId: string,
  opts: {
    watermarkDraft?: boolean;
    regenerate?: boolean;
    presignSeconds?: number
  }
}


export class GenerateQuotePdfAndStoreArtifact {


  constructor(
    private readonly quoteArtifactRepository: QuoteArtifactRepository,
    private readonly quoteVersionRepository: QuoteVersionRepository,
    private readonly pdf: PdfRenderer,
    private readonly storage: FileStorageService
  ) {

  }


  async execute({ quoteVersionId, opts }: Option) {

    const rec = await this.quoteVersionRepository.getVersion(quoteVersionId)
    if (!rec) throw new Error('QuoteVersion not found');
    const { version, items, quote } = rec

    const pdfBuffer = await this.pdf.renderQuoteVersion(version, items, quote, { watermarkDraft: opts.watermarkDraft })
    

    // 2) Checksum y metadatos
    const checksum = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
    const contentType = 'application/pdf';
    const sizeBytes = pdfBuffer.byteLength;

    // 3) Key de S3 (estable y auditable)
    const qn = rec.quote?.quoteNumber ?? 'no-number';
    const vnum = version.versionNumber ?? 1;
    const status = version.status === 'FINAL' ? 'FINAL' : 'DRAFT';
    const ts = new Date().toISOString().replace(/[:.]/g, '-');

    const key = [
      'quotes',
      String(qn),
      'versions',
      String(vnum),
      status.toLowerCase(),
      `quote-${qn}-v${vnum}-${ts}.pdf`
    ].join('/');

    const up = await this.storage.uploadBuffer({
      key,
      body: pdfBuffer,
      contentType: 'application/pdf'
    })

    const { artifactId } = await this.quoteArtifactRepository.createArtifact({
      quoteVersionId,
      type: 'PDF',
      fileKey: up.key
    })

   

    const presignedUrl = await this.storage.generatePresignedUrl(up.key, opts.presignSeconds ?? 1800);

    return {
      artifactId,
      storageKey: up.key,
      sizeBytes: up.sizeBytes,
      checksumSha256: up.checksumSha256,
      presignedUrl,
    };

  }
}