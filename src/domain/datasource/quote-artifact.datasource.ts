import { createArtifactDto } from "./quote-version.datasource";

export type CreateArtifactInput = {
  quoteVersionId: string;
  type: 'PDF' | 'HTML';
  fileKey: string;             // S3 key
  mimeType?: string | null;
  checksum?: string | null;
  publicUrl?: string | null;
};

export abstract class QuoteArtifactDatasource {
  abstract listByVersion(quoteVersionId: string): Promise<any[]>;    // artifacts
  abstract get(artifactId: string): Promise<any | null>;
  
  abstract createArtifact(input: createArtifactDto): Promise<{ artifactId: string }>
  // abstract createArtifact(input: CreateArtifactInput): Promise<any>; // QuoteArtifactEntity

  abstract findLatestPdfArtifact(quoteVersionId: string, status?: 'FINAL' | 'DRAFT'):
    Promise<null | { id: string; fileKey: string; checksum: string; createdAt:Date }>;
}
