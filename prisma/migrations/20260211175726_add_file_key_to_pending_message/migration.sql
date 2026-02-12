-- AlterTable
ALTER TABLE "PendingMessage" ADD COLUMN     "fileKey" TEXT,
ALTER COLUMN "body" DROP NOT NULL;
