import { FileStorageService } from '../../../domain/services/file-storage.service';


export class SaveMediaFileUseCase {

  constructor(private readonly fileStorageService: FileStorageService) { }
  async execute(file: ReadableStream<Uint8Array<ArrayBufferLike>>, filename: string) {

    await this.fileStorageService.upload(file, filename)

    return this.fileStorageService.generatePresignedUrl(filename, 3600)

  }
}