import { envs } from "../../config/envs";
import { FileStorageService, UploadOptions, UploadResult } from "../../domain/services/file-storage.service";
import { S3Client, GetObjectCommand, S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';




export class S3FileStorageService implements FileStorageService {




  private client = new S3Client({
    region: envs.AWS_REGION,
    credentials: {
      accessKeyId: envs.AWS_ACCESS_KEY_ID,
      secretAccessKey: envs.AWS_SECRET_ACCESS_KEY,
    },
  })


  async upload(file: ReadableStream<Uint8Array<ArrayBufferLike>>, fileName: string): Promise<string> {

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: envs.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file,
        // ACL: 'public-read',
      },
    })

    const result = await upload.done();
    return result.Location;
  }

  async uploadBuffer(options: UploadOptions): Promise<UploadResult> {

    const checksumSha256 = crypto.createHash('sha256').update(options.body).digest('hex')
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: envs.AWS_BUCKET_NAME,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
        Metadata: {
          checksumSha256,
          ...options.metadata,
        },
      },
    });

    await upload.done();

    return {
      key: options.key,
      sizeBytes: options.body.byteLength,
      contentType: options.contentType,
      checksumSha256,
    };

  }


  async generatePresignedUrl(key: string, expiresInSec = 3600): Promise<string> {
    const cmd = new GetObjectCommand({
      Bucket: envs.AWS_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `inline; filename="${key}"`,
      ResponseContentType: 'application/pdf',
    });
    return await getSignedUrl(this.client, cmd, { expiresIn: expiresInSec });
  }

  async getFileStream(key: string) {
    const { Body, ContentType } = await this.client.send(new GetObjectCommand({
      Bucket: envs.AWS_BUCKET_NAME,
      Key: key,
    }))

    if (!Body) throw new Error('No se pudo leer el stream de S3');

    const body = Body as ReadableStream

    return {
      body,
      ContentType
    }
  }



}