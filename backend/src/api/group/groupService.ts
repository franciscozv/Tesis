import { StatusCodes } from "http-status-codes";

import type { Group } from "@/api/group/groupModel";
import { GroupRepository, groups } from "@/api/group/groupRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class GroupService {
  private groupRepository: GroupRepository;

  constructor(repository: GroupRepository = new GroupRepository()) {
    this.groupRepository = repository;
  }

  // Retrieves all groups from the database
  async findAll(): Promise<ServiceResponse<Group[] | null>> {
    try {
      const users = await this.groupRepository.findAllAsync();
      if (!users || users.length === 0) {
        return ServiceResponse.failure(
          "No Groups found",
          null,
          StatusCodes.NOT_FOUND
        );
      }
      return ServiceResponse.success<Group[]>("Groups found", groups);
    } catch (ex) {
      const errorMessage = `Error finding all groups: $${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving users.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Retrieves a single user by their ID
  async findById(id: number): Promise<ServiceResponse<Group | null>> {
    try {
      const group = await this.groupRepository.findByIdAsync(id);
      if (!group) {
        return ServiceResponse.failure(
          "User not found",
          null,
          StatusCodes.NOT_FOUND
        );
      }
      return ServiceResponse.success<Group>("Group found", group);
    } catch (ex) {
      const errorMessage = `Error finding group with id ${id}:, ${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while finding group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  // Creates a new group
  async create(data: {
    name: string;
    description: string;
  }): Promise<ServiceResponse<Group | null>> {
    try {
      const { name, description } = data;

      if (!name || !description) {
        return ServiceResponse.failure(
          "Name and description are required",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      const newGroup = await this.groupRepository.createAsync({
        name,
        description,
      });

      return ServiceResponse.success<Group>(
        "Group created",
        newGroup,
        StatusCodes.CREATED
      );
    } catch (ex) {
      const errorMessage = `Error creating group: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  // Deletes a group by its ID

  async deleteById(id: number): Promise<ServiceResponse<null>> {
    try {
      const deleted = await this.groupRepository.deleteByIdAsync(id);

      if (!deleted) {
        return ServiceResponse.failure(
          "Group not found",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success(
        "Group deleted successfully",
        null,
        StatusCodes.OK // ✅ 200 permite body
      );
    } catch (ex) {
      logger.error(
        `Error deleting group with id ${id}: ${(ex as Error).message}`
      );
      return ServiceResponse.failure(
        "An error occurred while deleting the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateById(
    id: number,
    data: { name: string; description?: string }
  ): Promise<ServiceResponse<Group | null>> {
    try {
      const updatedGroup = await this.groupRepository.updateByIdAsync(id, data);

      if (!updatedGroup) {
        return ServiceResponse.failure(
          "Group not found",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success(
        "Group updated successfully",
        updatedGroup
      );
    } catch (ex) {
      logger.error(
        `Error updating group with id ${id}: ${(ex as Error).message}`
      );
      return ServiceResponse.failure(
        "An error occurred while updating the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const groupService = new GroupService();
