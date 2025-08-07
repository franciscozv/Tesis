import type { PeopleOnGroups } from "@/api/peopleOnGroups/peopleOnGroupsModel";
import prisma from "@/lib/prisma";

export class PeopleOnGroupsRepository {
  async addPersonToGroupAsync(data: Omit<PeopleOnGroups, "assignedAt" | "status">): Promise<PeopleOnGroups> {
    return await prisma.peopleOnGroups.upsert({
      where: { personId_groupId: { personId: data.personId, groupId: data.groupId } },
      update: { status: "ACTIVE", personRoleId: data.personRoleId },
      create: data,
    });
  }

  async getPeopleInGroupAsync(groupId: number): Promise<any[]> {
    return await prisma.peopleOnGroups.findMany({
      where: { groupId },
      include: { person: true, personRole: true },
    });
  }

  async removePersonFromGroupAsync(personId: number, groupId: number): Promise<void> {
    await prisma.peopleOnGroups.delete({
      where: { personId_groupId: { personId, groupId } },
    });
  }

  async updatePersonInGroupAsync(
    personId: number,
    groupId: number,
    data: Partial<Omit<PeopleOnGroups, "personId" | "groupId" | "assignedAt">>,
  ): Promise<PeopleOnGroups | null> {
    return await prisma.peopleOnGroups.update({
      where: { personId_groupId: { personId, groupId } },
      data,
    });
  }
}