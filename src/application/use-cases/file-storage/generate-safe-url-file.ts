import { FileStorageService } from '../../../domain/services/file-storage.service';



export class GenerateSafeUrlFile {


  constructor(private readonly fileStorageService: FileStorageService) { }


  execute(filename: string, expiresInSec: number = 3600) {

    return this.fileStorageService.generatePresignedUrl(filename, expiresInSec)

  }
}