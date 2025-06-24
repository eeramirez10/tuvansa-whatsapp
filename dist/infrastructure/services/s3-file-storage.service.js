"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3FileStorageService = void 0;
const envs_1 = require("../../config/envs");
const client_s3_1 = require("@aws-sdk/client-s3");
const lib_storage_1 = require("@aws-sdk/lib-storage");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class S3FileStorageService {
    constructor() {
        this.client = new client_s3_1.S3Client({
            region: envs_1.envs.AWS_REGION,
            credentials: {
                accessKeyId: envs_1.envs.AWS_ACCESS_KEY_ID,
                secretAccessKey: envs_1.envs.AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    upload(file, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const upload = new lib_storage_1.Upload({
                client: this.client,
                params: {
                    Bucket: envs_1.envs.AWS_BUCKET_NAME,
                    Key: fileName,
                    Body: file,
                    // ACL: 'public-read',
                },
            });
            const result = yield upload.done();
            return result.Location;
        });
    }
    generatePresignedUrl(key_1) {
        return __awaiter(this, arguments, void 0, function* (key, expiresInSec = 3600) {
            const cmd = new client_s3_1.GetObjectCommand({
                Bucket: envs_1.envs.AWS_BUCKET_NAME,
                Key: key,
                // ResponseContentDisposition: `inline; filename="${key}"`, 
                // ResponseContentType:        'application/pdf',
            });
            return yield (0, s3_request_presigner_1.getSignedUrl)(this.client, cmd, { expiresIn: expiresInSec });
        });
    }
    getFileStream(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const { Body, ContentType } = yield this.client.send(new client_s3_1.GetObjectCommand({
                Bucket: envs_1.envs.AWS_BUCKET_NAME,
                Key: key,
            }));
            if (!Body)
                throw new Error('No se pudo leer el stream de S3');
            const body = Body;
            return {
                body,
                ContentType
            };
        });
    }
}
exports.S3FileStorageService = S3FileStorageService;
