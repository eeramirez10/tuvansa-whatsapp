-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "chatThreadId" UUID;

-- CreateIndex
CREATE INDEX "Quote_chatThreadId_idx" ON "Quote"("chatThreadId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_chatThreadId_fkey" FOREIGN KEY ("chatThreadId") REFERENCES "ChatThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;
