/*
  Warnings:

  - You are about to alter the column `amount` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - A unique constraint covering the columns `[stripe_session_id]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[request_id]` on the table `reviews` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripe_session_id` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "properties_status_idx";

-- DropIndex
DROP INDEX "requests_property_id_idx";

-- DropIndex
DROP INDEX "requests_status_idx";

-- DropIndex
DROP INDEX "requests_tenant_id_idx";

-- DropIndex
DROP INDEX "reviews_tenant_id_request_id_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "stripe_session_id" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_session_id_key" ON "payments"("stripe_session_id");

-- CreateIndex
CREATE INDEX "properties_status_created_at_idx" ON "properties"("status", "created_at");

-- CreateIndex
CREATE INDEX "requests_tenant_id_status_idx" ON "requests"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "requests_property_id_status_idx" ON "requests"("property_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_request_id_key" ON "reviews"("request_id");
