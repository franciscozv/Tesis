import { PeopleOnGroupsRepository } from './peopleOnGroupsRepository';
import { PeopleOnGroups } from './peopleOnGroupsModel';

export class PeopleOnGroupsService {
  constructor(private readonly repository: PeopleOnGroupsRepository) {}

  async addPersonToGroup(data: PeopleOnGroups) {
    return await this.repository.addPersonToGroup(data);
  }

  async getPeopleInGroup(groupId: number) {
    return await this.repository.getPeopleInGroup(groupId);
  }

  async removePersonFromGroup(personId: number, groupId: number) {
    return await this.repository.removePersonFromGroup(personId, groupId);
  }

  async updatePersonInGroup(personId: number, groupId: number, data: Partial<PeopleOnGroups>) {
    return await this.repository.updatePersonInGroup(personId, groupId, data);
  }
}