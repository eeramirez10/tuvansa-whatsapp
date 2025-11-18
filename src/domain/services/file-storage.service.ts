import { Readable } from "stream";
import { StreamingBlobPayloadOutputTypes } from "@smithy/types";

export interface UploadOptions {
  key: string;
  body: Uint8Array<ArrayBufferLike>;
  contentType: string; // ej. 'application/pdf'
  metadata?: Record<string, string>;
}

export type UploadResult = {
  key: string;
  sizeBytes: number;
  contentType: string;
  checksumSha256: string;
};


export abstract class FileStorageService {


  abstract upload(file: ReadableStream<Uint8Array<ArrayBufferLike>>, fileName: string): Promise<string>
  abstract generatePresignedUrl(key: string, expiresInSec: number): Promise<string>
  abstract getFileStream(key: string): Promise<{
    body: ReadableStream
    ContentType: string;
  }>

  abstract uploadBuffer(options: UploadOptions): Promise<UploadResult>

}