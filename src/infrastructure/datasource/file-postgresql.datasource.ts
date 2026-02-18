import { PrismaClient } from "@prisma/client";
import { FileDatasource } from "../../domain/datasource/file.datasource";
import { SaveTemporaryFileRequestDTO } from "../../domain/dtos/file/save-temporary-file-request.dto";
import { SaveTemporaryFileResponseDTO } from "../../domain/dtos/file/save-temporary-file-response.dto";
import { FindFileByKeyResponseDTO } from "../../domain/dtos/file/find-file-by-key-response.dto";

export class FilePostgresqlDataSource implements FileDatasource {

  private prisma = new PrismaClient()


  async saveTemporaryFile(request: SaveTemporaryFileRequestDTO): Promise<SaveTemporaryFileResponseDTO> {

    const { fileBuffer, filename, originalFilename, mimeType, chatThreadId } = request;

    const temporaryFile = await this.prisma.temporaryFile.create({
      data: {
        fileKey: filename,
        originalFilename,
        mimeType,
        chatThreadId,
        buffer: new Uint8Array(fileBuffer)
      }
    })

    return new SaveTemporaryFileResponseDTO(temporaryFile.fileKey);
  }

  async findByFileKey(fileKey: string): Promise<FindFileByKeyResponseDTO | null> {

    const tempFile = await this.prisma.temporaryFile.findUnique({
      where: { fileKey }
    })

    if (!tempFile) return null

    return new FindFileByKeyResponseDTO({ ...tempFile })
  }


  async deleteFile(id: string): Promise<void> {
    await this.prisma.temporaryFile.delete({
      where: {
        id
      }
    })
  }


}
