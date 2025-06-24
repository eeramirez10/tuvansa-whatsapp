"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateSafeUrlFile = void 0;
class GenerateSafeUrlFile {
    constructor(fileStorageService) {
        this.fileStorageService = fileStorageService;
    }
    execute(filename, expiresInSec = 3600) {
        return this.fileStorageService.generatePresignedUrl(filename, expiresInSec);
    }
}
exports.GenerateSafeUrlFile = GenerateSafeUrlFile;
