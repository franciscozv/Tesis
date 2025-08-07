import { StatusCodes } from "http-status-codes";

import type { PeopleOnGroups } from "@/api/peopleOnGroups/peopleOnGroupsModel";
import { PeopleOnGroupsRepository } from "@/api/peopleOnGroups/peopleOnGroupsRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class PeopleOnGroupsService {
  private repository: PeopleOnGroupsRepository;

  constructor(repository: PeopleOnGroupsRepository = new PeopleOnGroupsRepository()) {
    this.repository = repository;
  }

  async addPersonToGroup(data: Omit<PeopleOnGroups, "assignedAt" | "status">): Promise<ServiceResponse<PeopleOnGroups | null>> {
    try {
      const newMember = await this.repository.addPersonToGroupAsync(data);
      return ServiceResponse.success<PeopleOnGroups>("Person added to group", newMember, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error adding person to group: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while adding the person to the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getPeopleInGroup(groupId: number): Promise<ServiceResponse<any[] | null>> {
    try {
      const people = await this.repository.getPeopleInGroupAsync(groupId);
      return ServiceResponse.success<any[]>("People in group found", people);
    } catch (ex) {
      const errorMessage = `Error finding people in group: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving people in the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removePersonFromGroup(personId: number, groupId: number): Promise<ServiceResponse<null>> {
    try {
      await this.repository.removePersonFromGroupAsync(personId, groupId);
      return ServiceResponse.success("Person removed from group successfully", null, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error removing person from group: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while removing the person from the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updatePersonInGroup(
    personId: number,
    groupId: number,
    data: Partial<Omit<PeopleOnGroups, "personId" | "groupId" | "assignedAt">>,
  ): Promise<ServiceResponse<PeopleOnGroups | null>> {
    try {
      const updatedMember = await this.repository.updatePersonInGroupAsync(personId, groupId, data);
      if (!updatedMember) {
        return ServiceResponse.failure("Person in group not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Person in group updated successfully", updatedMember);
    } catch (ex) {
      logger.error(`Error updating person in group: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        "An error occurred while updating the person in the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const peopleOnGroupsService = new PeopleOnGroupsService();
