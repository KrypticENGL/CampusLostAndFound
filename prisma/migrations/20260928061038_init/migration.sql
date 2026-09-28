-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "contactName" TEXT,
    "contactType" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Item_itemType_status_idx" ON "Item"("itemType", "status");

-- CreateIndex
CREATE INDEX "Item_category_idx" ON "Item"("category");

-- CreateIndex
CREATE INDEX "Item_date_idx" ON "Item"("date");

-- CreateIndex
CREATE INDEX "Item_createdAt_idx" ON "Item"("createdAt");
