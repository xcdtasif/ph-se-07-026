-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false;
