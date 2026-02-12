-- CreateTable
CREATE TABLE "TemporaryFile" (
    "id" UUID NOT NULL,
    "fileKey" TEXT NOT NULL,
    "buffer" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "chatThreadId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemporaryFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemporaryFile_fileKey_key" ON "TemporaryFile"("fileKey");

-- CreateIndex
CREATE INDEX "TemporaryFile_chatThreadId_idx" ON "TemporaryFile"("chatThreadId");

-- CreateIndex
CREATE INDEX "TemporaryFile_createdAt_idx" ON "TemporaryFile"("createdAt");

-- AddForeignKey
ALTER TABLE "TemporaryFile" ADD CONSTRAINT "TemporaryFile_chatThreadId_fkey" FOREIGN KEY ("chatThreadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
