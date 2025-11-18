import { createArtifactDto } from "../datasource/quote-version.datasource";


export abstract class QuoteArtifactRepository {

  abstract listByVersion(quoteVersionId: string): Promise<any[]>;    // artifacts
  abstract get(artifactId: string): Promise<any | null>;

  abstract createArtifact(input: createArtifactDto): Promise<{ artifactId: string }>


  abstract findLatestPdfArtifact(quoteVersionId: string, status?: 'FINAL' | 'DRAFT'):
    Promise<null | { id: string; fileKey: string; checksum: string; createdAt: Date}>;


}