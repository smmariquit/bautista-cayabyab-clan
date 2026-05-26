-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nicknames" TEXT,
    "suffix" TEXT,
    "lineageCode" TEXT,
    "gender" TEXT,
    "birthDate" TEXT,
    "deathDate" TEXT,
    "birthPlace" TEXT,
    "deathPlace" TEXT,
    "occupation" TEXT,
    "education" TEXT,
    "bio" TEXT,
    "photoUrl" TEXT,
    "generation" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ParentChild" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    CONSTRAINT "ParentChild_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ParentChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partner1Id" TEXT NOT NULL,
    "partner2Id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'married',
    "date" TEXT,
    "notes" TEXT,
    CONSTRAINT "Partnership_partner1Id_fkey" FOREIGN KEY ("partner1Id") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Partnership_partner2Id_fkey" FOREIGN KEY ("partner2Id") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_lineageCode_key" ON "Person"("lineageCode");

-- CreateIndex
CREATE UNIQUE INDEX "ParentChild_parentId_childId_key" ON "ParentChild"("parentId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_partner1Id_partner2Id_key" ON "Partnership"("partner1Id", "partner2Id");
