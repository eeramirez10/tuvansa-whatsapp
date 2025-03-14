/*
  Warnings:

  - Added the required column `quantity` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `um` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "quantity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "um" TEXT NOT NULL;
