-- Migration: v2 rework
-- Drop old tables/enums and recreate with new schema

-- Drop old foreign keys and tables in dependency order
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "Vehicle" CASCADE;
DROP TABLE IF EXISTS "Allocation" CASCADE;
DROP TABLE IF EXISTS "ProductionLog" CASCADE;
DROP TABLE IF EXISTS "Buyer" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS "UserRole";
DROP TYPE IF EXISTS "AllocationStatus";
DROP TYPE IF EXISTS "VehicleStatus";
DROP TYPE IF EXISTS "AuditAction";

-- Recreate enums
CREATE TYPE "VehicleStatus" AS ENUM ('REGISTERED', 'PICKED_UP');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- User
CREATE TABLE "User" (
    "id"           TEXT        NOT NULL,
    "name"         TEXT        NOT NULL,
    "email"        TEXT        NOT NULL,
    "passwordHash" TEXT        NOT NULL,
    "isAdmin"      BOOLEAN     NOT NULL DEFAULT false,
    "permissions"  TEXT[]      NOT NULL DEFAULT '{}',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Product
CREATE TABLE "Product" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "grade"     TEXT         NOT NULL,
    "unit"      TEXT         NOT NULL DEFAULT 'MT',
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- ProductionLog
CREATE TABLE "ProductionLog" (
    "id"         TEXT         NOT NULL,
    "productId"  TEXT         NOT NULL,
    "tonnage"    DOUBLE PRECISION NOT NULL,
    "date"       DATE         NOT NULL,
    "operatorId" TEXT         NOT NULL,
    "notes"      TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductionLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProductionLog_date_idx"      ON "ProductionLog"("date");
CREATE INDEX "ProductionLog_productId_idx" ON "ProductionLog"("productId");

-- Buyer
CREATE TABLE "Buyer" (
    "id"        TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "contact"   TEXT,
    "address"   TEXT,
    "createdBy" TEXT         NOT NULL,
    "isActive"  BOOLEAN      NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Buyer_pkey" PRIMARY KEY ("id")
);

-- Vehicle
CREATE TABLE "Vehicle" (
    "id"            TEXT             NOT NULL,
    "buyerId"       TEXT             NOT NULL,
    "vehicleNumber" TEXT             NOT NULL,
    "driverName"    TEXT,
    "driverPhone"   TEXT,
    "status"        "VehicleStatus"  NOT NULL DEFAULT 'REGISTERED',
    "registeredBy"  TEXT             NOT NULL,
    "pickedUpAt"    TIMESTAMP(3),
    "notes"         TEXT,
    "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3)     NOT NULL,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Vehicle_buyerId_idx" ON "Vehicle"("buyerId");
CREATE INDEX "Vehicle_status_idx"  ON "Vehicle"("status");

-- VehicleItem
CREATE TABLE "VehicleItem" (
    "id"        TEXT             NOT NULL,
    "vehicleId" TEXT             NOT NULL,
    "productId" TEXT             NOT NULL,
    "tonnage"   DOUBLE PRECISION NOT NULL,
    CONSTRAINT "VehicleItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VehicleItem_vehicleId_idx"  ON "VehicleItem"("vehicleId");
CREATE INDEX "VehicleItem_productId_idx"  ON "VehicleItem"("productId");

-- AuditLog
CREATE TABLE "AuditLog" (
    "id"        TEXT         NOT NULL,
    "userId"    TEXT         NOT NULL,
    "action"    "AuditAction" NOT NULL,
    "entity"    TEXT         NOT NULL,
    "entityId"  TEXT         NOT NULL,
    "before"    JSONB,
    "after"     JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_entity_idx"    ON "AuditLog"("entity");
CREATE INDEX "AuditLog_userId_idx"    ON "AuditLog"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Foreign keys
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductionLog" ADD CONSTRAINT "ProductionLog_operatorId_fkey"
    FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_registeredBy_fkey"
    FOREIGN KEY ("registeredBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "VehicleItem" ADD CONSTRAINT "VehicleItem_vehicleId_fkey"
    FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VehicleItem" ADD CONSTRAINT "VehicleItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
