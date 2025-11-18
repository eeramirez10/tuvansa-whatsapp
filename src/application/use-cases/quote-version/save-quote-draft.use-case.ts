import { QuoteVersionRepository } from '../../../domain/repositories/quote-version.repository';
import { SaveDraftDto } from '../../../domain/dtos/versions/save-draft.dto';
export class SaveQuoteDraftUseCase {

  constructor(private quoteVersion: QuoteVersionRepository) { }

  async execute(saveDraftDto: SaveDraftDto) {


    const { version, items: versionItems } = await this.quoteVersion.saveDraft(saveDraftDto)


    return {
      version,
      items: versionItems 
    }

  }

}