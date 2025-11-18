import { VersionStatus } from "@prisma/client";
import { createArtifactDto, FinalizeAndVersionInput, QuoteVersionDatasource, QuoteVersionWithItems } from "../../domain/datasource/quote-version.datasource";
import { SaveDraftDto } from "../../domain/dtos/versions/save-draft.dto";
import { QuoteVersionRepository } from "../../domain/repositories/quote-version.repository";

export class QuoteVersionRepositoryImpl implements QuoteVersionRepository {

  constructor(private quoteVersionDatasource: QuoteVersionDatasource) { }



  updateStatus(id: string, status: VersionStatus): Promise<QuoteVersionWithItems | null> {
    return this.quoteVersionDatasource.updateStatus(id, status)
  }


  getDraftByQuote(quoteId: string): Promise<QuoteVersionWithItems | null> {
    return this.quoteVersionDatasource.getDraftByQuote(quoteId)
  }


  createVersion(input: FinalizeAndVersionInput): Promise<QuoteVersionWithItems> {
    return this.quoteVersionDatasource.createVersion(input)
  }
  saveDraft(input: SaveDraftDto): Promise<QuoteVersionWithItems> {
    return this.quoteVersionDatasource.saveDraft(input)
  }



  listByQuote(quoteId: string): Promise<{ id: string; versionNumber: number; createdAt: Date; grandTotal: string; }[]> {
    return this.quoteVersionDatasource.listByQuote(quoteId)
  }
  getVersion(versionId: string): Promise<QuoteVersionWithItems | null> {
    return this.quoteVersionDatasource.getVersion(versionId)
  }
  getByQuoteAndNumber(quoteId: string, versionNumber: number): Promise<QuoteVersionWithItems | null> {

    return this.quoteVersionDatasource.getByQuoteAndNumber(quoteId, versionNumber)
  }




}