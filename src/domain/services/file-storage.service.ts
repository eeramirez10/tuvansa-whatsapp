import { Readable } from "stream";
import { StreamingBlobPayloadOutputTypes } from "@smithy/types";


export abstract class FileStorageService {


  abstract upload(file: ReadableStream<Uint8Array<ArrayBufferLike>>, fileName: string): Promise<string>
  abstract generatePresignedUrl(key: string, expiresInSec: number): Promise<string>
  abstract getFileStream(key: string):Promise<{
    body: ReadableStream 
    ContentType: string;
  }>

}