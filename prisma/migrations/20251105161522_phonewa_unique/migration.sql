/*
  Warnings:

  - A unique constraint covering the columns `[phoneWa]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Made the column `phoneWa` on table `Customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "phoneWa" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phoneWa_key" ON "Customer"("phoneWa");
