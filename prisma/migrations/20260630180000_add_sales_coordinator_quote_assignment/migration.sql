ALTER TYPE "UserRole" ADD VALUE 'SALES_COORDINATOR';
ALTER TYPE "UserRole" ADD VALUE 'VENDOR';

ALTER TABLE "Quote"
ADD COLUMN     "assignedSellerId" UUID,
ADD COLUMN     "assignedById" UUID,
ADD COLUMN     "assignedAt" TIMESTAMP(3);

CREATE INDEX "Quote_assignedSellerId_idx" ON "Quote"("assignedSellerId");
CREATE INDEX "Quote_assignedById_idx" ON "Quote"("assignedById");

ALTER TABLE "Quote"
ADD CONSTRAINT "Quote_assignedSellerId_fkey"
FOREIGN KEY ("assignedSellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Quote"
ADD CONSTRAINT "Quote_assignedById_fkey"
FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
