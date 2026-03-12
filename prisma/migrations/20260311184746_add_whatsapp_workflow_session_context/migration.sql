-- CreateEnum
CREATE TYPE "WhatsAppWorkflowSessionType" AS ENUM ('ERP_QUOTE_CAPTURE');

-- CreateTable
CREATE TABLE "WhatsAppWorkflowSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "WhatsAppWorkflowSessionType" NOT NULL,
    "quoteNumber" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppWorkflowSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WhatsAppWorkflowSession_expiresAt_idx" ON "WhatsAppWorkflowSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppWorkflowSession_userId_type_key" ON "WhatsAppWorkflowSession"("userId", "type");

-- AddForeignKey
ALTER TABLE "WhatsAppWorkflowSession" ADD CONSTRAINT "WhatsAppWorkflowSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
