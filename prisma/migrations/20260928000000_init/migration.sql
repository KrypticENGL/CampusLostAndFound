-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ELECTRONICS', 'DOCUMENTS', 'ACCESSORIES', 'BOOKS', 'BAGS', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('EMAIL', 'PHONE');

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'OPEN',
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "contactName" TEXT,
    "contactType" "ContactType" NOT NULL,
    "contactValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Item_itemType_status_idx" ON "Item"("itemType", "status");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");

-- CreateIndex
CREATE INDEX "Item_date_idx" ON "Item"("date");

-- CreateIndex
CREATE INDEX "Item_createdAt_idx" ON "Item"("createdAt");

