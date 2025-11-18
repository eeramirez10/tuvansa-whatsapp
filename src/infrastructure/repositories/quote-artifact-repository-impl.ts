import { createArtifactDto } from "../../domain/datasource/quote-version.datasource";
import { QuoteArtifactRepository } from '../../domain/repositories/quote-artifact.repository';


export class QuoteArtifactRepositoryImpl implements QuoteArtifactRepository {

  constructor(private readonly quoteArtifactRepository: QuoteArtifactRepository) { }

  listByVersion(quoteVersionId: string): Promise<any[]> {
    return this.quoteArtifactRepository.listByVersion(quoteVersionId)
  }
  get(artifactId: string): Promise<any | null> {
    return this.quoteArtifactRepository.get(artifactId)
  }
  createArtifact(input: createArtifactDto): Promise<{ artifactId: string; }> {
    return this.quoteArtifactRepository.createArtifact(input)
  }
  findLatestPdfArtifact(quoteVersionId: string, status?: "FINAL" | "DRAFT"): Promise<null | { id: string; fileKey: string; checksum: string; createdAt: Date}> {
    return this.quoteArtifactRepository.findLatestPdfArtifact(quoteVersionId, status)
  }


}