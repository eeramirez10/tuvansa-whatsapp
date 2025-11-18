/*
  Warnings:

  - You are about to drop the `QuoteHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('WHATSAPP', 'WEB', 'EMAIL');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('DRAFT', 'FINAL');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('PDF', 'HTML');

-- CreateEnum
CREATE TYPE "PriceOrigin" AS ENUM ('AUTOMATIC', 'MANUAL', 'PROMO', 'IMPORTED');

-- DropForeignKey
ALTER TABLE "QuoteHistory" DROP CONSTRAINT "QuoteHistory_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "QuoteHistory" DROP CONSTRAINT "QuoteHistory_userId_fkey";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "channel" "Channel" NOT NULL DEFAULT 'WHATSAPP',
ADD COLUMN     "contentSid" TEXT,
ADD COLUMN     "direction" "Direction" NOT NULL DEFAULT 'INBOUND',
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "from" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "media" JSONB,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerMessageId" TEXT,
ADD COLUMN     "quoteArtifactId" UUID,
ADD COLUMN     "quoteId" UUID,
ADD COLUMN     "quoteVersionId" UUID,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "templateCode" TEXT,
ADD COLUMN     "to" TEXT,
ADD COLUMN     "variables" JSONB;

-- DropTable
DROP TABLE "QuoteHistory";

-- CreateTable
CREATE TABLE "QuoteVersion" (
    "id" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "customerId" UUID,
    "versionNumber" INTEGER NOT NULL,
    "status" "VersionStatus" NOT NULL DEFAULT 'FINAL',
    "currency" TEXT NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL,
    "currencyRate" DECIMAL(12,6),
    "subtotal" DECIMAL(18,4) NOT NULL,
    "discountTotal" DECIMAL(18,4),
    "taxTotal" DECIMAL(18,4) NOT NULL,
    "grandTotal" DECIMAL(18,4) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "deliveryTime" TEXT,
    "notes" TEXT,
    "summary" TEXT,
    "sellerId" UUID,
    "customerSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteVersionItem" (
    "id" UUID NOT NULL,
    "quoteVersionId" UUID NOT NULL,
    "quoteItemId" UUID,
    "uiLineId" TEXT,
    "description" TEXT NOT NULL,
    "ean" TEXT,
    "codigo" TEXT,
    "um" TEXT NOT NULL DEFAULT 'UNIT',
    "quantity" DECIMAL(12,4) NOT NULL,
    "cost" DECIMAL(18,4),
    "currency" TEXT NOT NULL,
    "price" DECIMAL(18,4),
    "marginPct" DECIMAL(5,2),
    "lineTotal" DECIMAL(18,4) NOT NULL,
    "discountPct" DECIMAL(5,2),
    "discountAmount" DECIMAL(18,4),
    "taxRate" DECIMAL(5,4),
    "priceOrigin" "PriceOrigin" DEFAULT 'AUTOMATIC',
    "sourceProductKey" TEXT,
    "warehouse" TEXT,
    "binLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteVersionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteArtifact" (
    "id" UUID NOT NULL,
    "quoteVersionId" UUID NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "checksum" TEXT,
    "publicUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteVersion_quoteId_idx" ON "QuoteVersion"("quoteId");

-- CreateIndex
CREATE INDEX "QuoteVersion_customerId_idx" ON "QuoteVersion"("customerId");

-- CreateIndex
CREATE INDEX "QuoteVersion_sellerId_idx" ON "QuoteVersion"("sellerId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteVersion_quoteId_versionNumber_key" ON "QuoteVersion"("quoteId", "versionNumber");

-- CreateIndex
CREATE INDEX "QuoteVersionItem_quoteVersionId_idx" ON "QuoteVersionItem"("quoteVersionId");

-- CreateIndex
CREATE INDEX "QuoteVersionItem_quoteItemId_idx" ON "QuoteVersionItem"("quoteItemId");

-- CreateIndex
CREATE INDEX "QuoteArtifact_quoteVersionId_idx" ON "QuoteArtifact"("quoteVersionId");

-- CreateIndex
CREATE INDEX "QuoteArtifact_type_idx" ON "QuoteArtifact"("type");

-- CreateIndex
CREATE INDEX "Message_chatThreadId_createdAt_idx" ON "Message"("chatThreadId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_providerMessageId_idx" ON "Message"("providerMessageId");

-- CreateIndex
CREATE INDEX "Message_quoteId_idx" ON "Message"("quoteId");

-- CreateIndex
CREATE INDEX "Message_quoteVersionId_idx" ON "Message"("quoteVersionId");

-- CreateIndex
CREATE INDEX "Message_quoteArtifactId_idx" ON "Message"("quoteArtifactId");

-- CreateIndex
CREATE INDEX "Message_to_idx" ON "Message"("to");

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersionItem" ADD CONSTRAINT "QuoteVersionItem_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersionItem" ADD CONSTRAINT "QuoteVersionItem_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteArtifact" ADD CONSTRAINT "QuoteArtifact_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_quoteVersionId_fkey" FOREIGN KEY ("quoteVersionId") REFERENCES "QuoteVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_quoteArtifactId_fkey" FOREIGN KEY ("quoteArtifactId") REFERENCES "QuoteArtifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
