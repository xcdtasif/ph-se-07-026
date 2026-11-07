/*
  Warnings:

  - You are about to alter the column `rent` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `deposit` on the `properties` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE "properties" ALTER COLUMN "rent" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "deposit" SET DATA TYPE DECIMAL(12,2);
