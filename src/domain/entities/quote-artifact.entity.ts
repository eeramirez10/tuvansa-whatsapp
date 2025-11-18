// src/entities/quote-artifact.entity.ts

export type ArtifactType = 'PDF' | 'HTML'

export interface QuoteArtifactOptions {
  id: string;
  quoteVersionId: string;

  type: ArtifactType;
  fileKey: string;              // S3 key del artefacto
  mimeType?: string | null;
  checksum?: string | null;     // hash opcional (integridad)
  publicUrl?: string | null;    // si generas URL pública firmada/persistente

  createdAt: Date;

  // Relación ligera (opcional): ids de mensajes que lo enviaron
  messageIds?: string[] | null;
}

export class QuoteArtifactEntity {
  readonly id: string;
  readonly quoteVersionId: string;

  readonly type: ArtifactType;
  readonly fileKey: string;
  readonly mimeType: string | null;
  readonly checksum: string | null;
  readonly publicUrl: string | null;

  readonly createdAt: Date;

  // extra: para quick lookups en UI/servicios
  readonly messageIds?: string[] | null;

  constructor(opts: QuoteArtifactOptions) {
    this.id = opts.id;
    this.quoteVersionId = opts.quoteVersionId;

    this.type = opts.type;
    this.fileKey = opts.fileKey;
    this.mimeType = opts.mimeType ?? null;
    this.checksum = opts.checksum ?? null;
    this.publicUrl = opts.publicUrl ?? null;

    this.createdAt = opts.createdAt;

    this.messageIds = opts.messageIds ?? null;
  }

  // Helpers
  isPdf(): boolean {
    return this.type === 'PDF' || this.mimeType === 'application/pdf';
  }

  isHtml(): boolean {
    return this.type === 'HTML' || (this.mimeType?.includes('html') ?? false);
  }

  hasPublicUrl(): boolean {
    return !!this.publicUrl && this.publicUrl.length > 0;
  }

  // Si usas rutas S3, puedes obtener filename
  filename(): string {
    // Extrae lo que va después del último '/'
    const parts = this.fileKey.split('/');
    return parts[parts.length - 1] || this.fileKey;
  }

  // Mapper desde Prisma (fila cruda)
  static fromPrisma(row: any): QuoteArtifactEntity {
    return new QuoteArtifactEntity({
      id: row.id,
      quoteVersionId: row.quoteVersionId,
      type: row.type as ArtifactType,
      fileKey: row.fileKey,
      mimeType: row.mimeType ?? null,
      checksum: row.checksum ?? null,
      publicUrl: row.publicUrl ?? null,
      createdAt: row.createdAt,
      // si en tu consulta incluyes messages: { select: { id: true } }
      messageIds: Array.isArray(row.messages) ? row.messages.map((m: any) => m.id) : null,
    });
  }
}
