import { FindFileByKeyRequestDTO } from "../../domain/dtos/file/find-file-by-key-request.dto";
import { FindFileByKeyResponseDTO } from "../../domain/dtos/file/find-file-by-key-response.dto";
import { SaveTemporaryFileRequestDTO } from "../../domain/dtos/file/save-temporary-file-request.dto";
import { SaveTemporaryFileResponseDTO } from "../../domain/dtos/file/save-temporary-file-response.dto";
import { FileRepository } from "../../domain/repositories/file.repository";
import { FileDatasource } from '../../domain/datasource/file.datasource';


export class FileRepositoryImpl implements FileRepository {

  constructor(private readonly fileDatasource: FileDatasource) { }

  saveTemporaryFile(request: SaveTemporaryFileRequestDTO): Promise<SaveTemporaryFileResponseDTO> {
    return this.fileDatasource.saveTemporaryFile(request)
  }
  findByFileKey(fileKey: string): Promise<FindFileByKeyResponseDTO> {
    return this.fileDatasource.findByFileKey(fileKey)
  }
  deleteFile(id: string): Promise<void> {
    return this.fileDatasource.deleteFile(id)
  }

}