import prisma from '../../lib/prisma';
import { PeopleOnGroups } from './peopleOnGroupsModel';

export class PeopleOnGroupsRepository {
  async addPersonToGroup(data: PeopleOnGroups) {
    return await prisma.peopleOnGroups.upsert({
      where: { personId_groupId: { personId: data.personId, groupId: data.groupId } },
      update: { status: 'ACTIVE' }, // Or any other logic for existing members
      create: data,
    });
  }

  async getPeopleInGroup(groupId: number) {
    return await prisma.peopleOnGroups.findMany({
      where: { groupId },
      include: { person: true },
    });
  }

  async removePersonFromGroup(personId: number, groupId: number) {
    return await prisma.peopleOnGroups.delete({
      where: { personId_groupId: { personId, groupId } },
    });
  }

  async updatePersonInGroup(personId: number, groupId: number, data: Partial<PeopleOnGroups>) {
    return await prisma.peopleOnGroups.update({
      where: { personId_groupId: { personId, groupId } },
      data,
    });
  }
}