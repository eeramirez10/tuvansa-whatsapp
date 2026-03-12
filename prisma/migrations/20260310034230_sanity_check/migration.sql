-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'BRANCH_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'SUPPORT';
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';

-- DropIndex
DROP INDEX "Complaint_assigned_to_userId_idx";

-- DropIndex
DROP INDEX "Complaint_responded_by_userId_idx";

-- AlterTable
ALTER TABLE "Complaint" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SupplierCatalog" ALTER COLUMN "id" DROP DEFAULT;
