-- CreateEnum
CREATE TYPE "StockAdjustmentType" AS ENUM ('DAMAGE', 'WASTAGE', 'RETURN', 'CORRECTION');

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tonnage" DOUBLE PRECISION NOT NULL,
    "type" "StockAdjustmentType" NOT NULL,
    "reason" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "createdBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAdjustment_productId_idx" ON "StockAdjustment"("productId");

-- CreateIndex
CREATE INDEX "StockAdjustment_date_idx" ON "StockAdjustment"("date");

-- CreateIndex
CREATE INDEX "StockAdjustment_createdBy_idx" ON "StockAdjustment"("createdBy");

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
