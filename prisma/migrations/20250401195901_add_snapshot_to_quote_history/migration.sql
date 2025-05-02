/*
  Warnings:

  - Added the required column `snapshot` to the `QuoteHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuoteHistory" ADD COLUMN     "snapshot" JSONB NOT NULL;
