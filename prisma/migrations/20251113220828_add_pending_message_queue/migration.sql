-- CreateEnum
CREATE TYPE "PendingMessageStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'ERROR');

-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN     "isProcessing" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PendingMessage" (
    "id" UUID NOT NULL,
    "chatThreadId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "status" "PendingMessageStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingMessage_chatThreadId_status_createdAt_idx" ON "PendingMessage"("chatThreadId", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "PendingMessage" ADD CONSTRAINT "PendingMessage_chatThreadId_fkey" FOREIGN KEY ("chatThreadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
