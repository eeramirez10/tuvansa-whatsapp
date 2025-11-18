export interface UploadResult {
  key: string;
  sizeBytes: number;
  contentType: string;
  checksumSha256: string;
}

export interface StoragePort {
  upload(opts: {
    key: string;
    contentType: string;
    body: Buffer | Uint8Array;
    checksumSha256?: string; // si ya lo tienes, úsalo para validar
    metadata?: Record<string, string>;
  }): Promise<UploadResult>;

  getPresignedUrl(key: string, expiresSeconds?: number): Promise<string>;
}