-- CreateEnum
CREATE TYPE "UserIntent" AS ENUM ('QUOTE', 'SUPPLIER', 'COMPLAINT');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('PENDING', 'CONTACTED', 'ACTIVE', 'REJECTED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED');

-- AlterTable
ALTER TABLE "ChatThread" ADD COLUMN "userIntent" "UserIntent",
ADD COLUMN "supplier_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "complaint_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN "managerId" UUID;

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chatThreadId" UUID NOT NULL,
    "company_name" TEXT NOT NULL,
    "contact_person" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "SupplierStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierCatalog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supplierId" UUID NOT NULL,
    "catalog_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "file_key" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chatThreadId" UUID NOT NULL,
    "customerId" UUID,
    "reporter_name" TEXT,
    "reporter_email" TEXT,
    "reporter_phone" TEXT,
    "complaint_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "branch_name" TEXT,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "assigned_to_userId" UUID,
    "responded_by_userId" UUID,
    "action_taken" TEXT,
    "action_timestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Supplier_chatThreadId_idx" ON "Supplier"("chatThreadId");

-- CreateIndex
CREATE INDEX "SupplierCatalog_supplierId_idx" ON "SupplierCatalog"("supplierId");

-- CreateIndex
CREATE INDEX "Complaint_chatThreadId_idx" ON "Complaint"("chatThreadId");

-- CreateIndex
CREATE INDEX "Complaint_customerId_idx" ON "Complaint"("customerId");

-- CreateIndex
CREATE INDEX "Complaint_assigned_to_userId_idx" ON "Complaint"("assigned_to_userId");

-- CreateIndex
CREATE INDEX "Complaint_responded_by_userId_idx" ON "Complaint"("responded_by_userId");

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_chatThreadId_fkey" FOREIGN KEY ("chatThreadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCatalog" ADD CONSTRAINT "SupplierCatalog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_chatThreadId_fkey" FOREIGN KEY ("chatThreadId") REFERENCES "ChatThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assigned_to_userId_fkey" FOREIGN KEY ("assigned_to_userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_responded_by_userId_fkey" FOREIGN KEY ("responded_by_userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

