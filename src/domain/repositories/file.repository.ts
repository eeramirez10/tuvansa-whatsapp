import { FindFileByKeyRequestDTO } from "../dtos/file/find-file-by-key-request.dto";
import { FindFileByKeyResponseDTO } from "../dtos/file/find-file-by-key-response.dto";
import { SaveTemporaryFileRequestDTO } from "../dtos/file/save-temporary-file-request.dto";
import { SaveTemporaryFileResponseDTO } from "../dtos/file/save-temporary-file-response.dto";


export abstract class FileRepository {


  abstract saveTemporaryFile(request: SaveTemporaryFileRequestDTO): Promise<SaveTemporaryFileResponseDTO>
  abstract findByFileKey(fileKey: string): Promise<FindFileByKeyResponseDTO | null>
  abstract deleteFile(id: string): Promise<void>


}
