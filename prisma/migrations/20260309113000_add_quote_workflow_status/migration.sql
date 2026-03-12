-- CreateEnum
CREATE TYPE "QuoteWorkflowStatus" AS ENUM ('NEW', 'VIEWED', 'DOWNLOADED', 'QUOTED', 'REJECTED', 'INVOICED');

-- AlterTable
ALTER TABLE "Quote"
ADD COLUMN     "workflowStatus" "QuoteWorkflowStatus" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "seenAt" TIMESTAMP(3),
ADD COLUMN     "downloadedAt" TIMESTAMP(3),
ADD COLUMN     "erpQuoteNumber" TEXT,
ADD COLUMN     "erpQuoteAt" TIMESTAMP(3),
ADD COLUMN     "erpSystem" TEXT,
ADD COLUMN     "erpInvoiceNumber" TEXT,
ADD COLUMN     "invoicedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedReason" TEXT,
ADD COLUMN     "lastReminderAt" TIMESTAMP(3),
ADD COLUMN     "reminderCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "workflowUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "workflowUpdatedById" UUID;

-- CreateIndex
CREATE INDEX "Quote_workflowStatus_idx" ON "Quote"("workflowStatus");

-- CreateIndex
CREATE INDEX "Quote_branchId_workflowStatus_idx" ON "Quote"("branchId", "workflowStatus");
