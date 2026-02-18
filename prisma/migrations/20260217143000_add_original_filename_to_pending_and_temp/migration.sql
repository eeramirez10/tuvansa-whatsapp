ALTER TABLE "TemporaryFile"
ADD COLUMN "originalFilename" TEXT;

ALTER TABLE "PendingMessage"
ADD COLUMN "originalFilename" TEXT;
