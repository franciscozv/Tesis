-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "color" TEXT,
ADD COLUMN     "mision" TEXT,
ADD COLUMN     "vision" TEXT;

-- CreateTable
CREATE TABLE "PeopleOnGroups" (
    "personId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "PeopleOnGroups_pkey" PRIMARY KEY ("personId","groupId")
);

-- AddForeignKey
ALTER TABLE "PeopleOnGroups" ADD CONSTRAINT "PeopleOnGroups_personId_fkey" FOREIGN KEY ("personId") REFERENCES "People"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleOnGroups" ADD CONSTRAINT "PeopleOnGroups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
