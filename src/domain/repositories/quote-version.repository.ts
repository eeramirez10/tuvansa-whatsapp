import { VersionStatus } from "@prisma/client";
import { createArtifactDto, FinalizeAndVersionInput, QuoteVersionWithItems } from "../datasource/quote-version.datasource";
import { SaveDraftDto } from "../dtos/versions/save-draft.dto";

export abstract class QuoteVersionRepository {

  abstract createVersion(input: FinalizeAndVersionInput): Promise<QuoteVersionWithItems>;
  abstract saveDraft(input: SaveDraftDto): Promise<QuoteVersionWithItems>;
  abstract getDraftByQuote(quoteId: string): Promise<QuoteVersionWithItems | null>;
  abstract listByQuote(quoteId: string): Promise<{ id: string; versionNumber: number; createdAt: Date; grandTotal: string }[]>;
  abstract getVersion(versionId: string): Promise<QuoteVersionWithItems | null>;
  abstract getByQuoteAndNumber(quoteId: string, versionNumber: number): Promise<QuoteVersionWithItems | null>;
   abstract updateStatus(id: string, status: VersionStatus): Promise<QuoteVersionWithItems | null>


}