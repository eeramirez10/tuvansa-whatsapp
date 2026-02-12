import { FileStorageService } from '../../../domain/services/file-storage.service';
import { FileRepository } from '../../../domain/repositories/file.repository';
import { SaveMediaFileUseCase } from '../file-storage/save-media-file.use-case';

interface Option {
  fileKey: string
  chatThreadId: string
}


export class ProcessFileForQuoteUseCase {

  constructor(
    private readonly fileStorageService: FileStorageService,
    private readonly fileRepository: FileRepository
  ) { }

  async execute(options: Option) {

    const { fileKey, chatThreadId } = options;

    const tempFile = await this.fileRepository.findByFileKey(fileKey);

    if (!tempFile) {
      return {
        success: false,
        message: 'Archivo no encontrado'
      }
    }

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(tempFile.buffer);
        controller.close();
      }
    });

    await new SaveMediaFileUseCase(this.fileStorageService).execute(stream, tempFile.fileKey);

    await this.fileRepository.deleteFile(tempFile.id)

    return {
      success: true,
      message: `Archivo ${fileKey} procesado y guardado correctamente`
    };
  }

}