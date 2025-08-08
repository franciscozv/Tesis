/*
  Warnings:

  - Added the required column `personRoleId` to the `PeopleOnGroups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PeopleOnGroups" ADD COLUMN     "personRoleId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "PeopleRole" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeopleRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRoleAssignment" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PeopleRole_name_key" ON "PeopleRole"("name");

-- AddForeignKey
ALTER TABLE "PeopleOnGroups" ADD CONSTRAINT "PeopleOnGroups_personRoleId_fkey" FOREIGN KEY ("personRoleId") REFERENCES "PeopleRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRoleAssignment" ADD CONSTRAINT "GroupRoleAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRoleAssignment" ADD CONSTRAINT "GroupRoleAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "PeopleRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
