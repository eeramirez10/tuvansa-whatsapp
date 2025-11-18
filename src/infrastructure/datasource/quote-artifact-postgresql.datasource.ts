
import { PrismaClient } from "@prisma/client";
import { QuoteArtifactDatasource } from "../../domain/datasource/quote-artifact.datasource";
import { createArtifactDto } from "../../domain/datasource/quote-version.datasource";


const prismaClient = new PrismaClient()

export class QuoteArtifactPostgresql implements QuoteArtifactDatasource {


  listByVersion(quoteVersionId: string): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  get(artifactId: string): Promise<any | null> {
    throw new Error("Method not implemented.");
  }
  async createArtifact(input: createArtifactDto): Promise<{ artifactId: string; }> {
    const art = await prismaClient.quoteArtifact.create({
      data: {
        quoteVersionId: input.quoteVersionId,
        type: input.type,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        checksum: input.checksum

      },
      select: {
        id: true
      }
    })

    return { artifactId: art.id }

  }
  async findLatestPdfArtifact(quoteVersionId: string, status?: "FINAL" | "DRAFT"): Promise<null | { id: string; fileKey: string; checksum: string; createdAt: Date }> {

    return await prismaClient.quoteArtifact.findFirst({
      where: {
        quoteVersionId,
        type: 'PDF'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        fileKey: true,
        checksum: true,
        createdAt: true
      }
    })
  }


}