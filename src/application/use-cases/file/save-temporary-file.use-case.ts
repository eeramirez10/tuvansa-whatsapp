import { SaveTemporaryFileRequestDTO } from '../../../domain/dtos/file/save-temporary-file-request.dto';
import { FileRepository } from '../../../domain/repositories/file.repository';




export class SaveTemporaryFileUseCase {



  constructor(private readonly fileRepo: FileRepository) {
  }

  async execute(request: SaveTemporaryFileRequestDTO) {

    const { fileKey } = await this.fileRepo.saveTemporaryFile(request);

    return {
      fileKey
    }

  }
}