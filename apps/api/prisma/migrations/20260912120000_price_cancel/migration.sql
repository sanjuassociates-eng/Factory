-- Add CANCELLED to VehicleStatus enum
ALTER TYPE "VehicleStatus" ADD VALUE 'CANCELLED';

-- Add pricePerUnit to VehicleItem
ALTER TABLE "VehicleItem" ADD COLUMN "pricePerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0;
