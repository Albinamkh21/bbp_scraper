-- AlterTable
ALTER TABLE "product" ALTER COLUMN "rating" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "seller" ADD COLUMN     "url" TEXT,
ALTER COLUMN "rating" SET DATA TYPE DECIMAL(5,2);
