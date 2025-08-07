import { StatusCodes } from "http-status-codes";

import type { GroupRoleAssignment } from "@/api/groupRoleAssignment/groupRoleAssignmentModel";
import { GroupRoleAssignmentRepository } from "@/api/groupRoleAssignment/groupRoleAssignmentRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class GroupRoleAssignmentService {
  private repository: GroupRoleAssignmentRepository;

  constructor(repository: GroupRoleAssignmentRepository = new GroupRoleAssignmentRepository()) {
    this.repository = repository;
  }

  async assignRoleToGroup(groupId: number, roleId: number): Promise<ServiceResponse<GroupRoleAssignment | null>> {
    try {
      const assignment = await this.repository.assignRoleToGroupAsync(groupId, roleId);
      return ServiceResponse.success<GroupRoleAssignment>("Role assigned to group", assignment, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error assigning role to group: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while assigning the role to the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeRoleFromGroup(groupId: number, roleId: number): Promise<ServiceResponse<null>> {
    try {
      await this.repository.removeRoleFromGroupAsync(groupId, roleId);
      return ServiceResponse.success("Role removed from group successfully", null, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error removing role from group: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while removing the role from the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getRolesForGroup(groupId: number): Promise<ServiceResponse<any[] | null>> {
    try {
      const roles = await this.repository.getRolesForGroupAsync(groupId);
      return ServiceResponse.success<any[]>("Roles for group found", roles);
    } catch (ex) {
      const errorMessage = `Error finding roles for group: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving roles for the group.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const groupRoleAssignmentService = new GroupRoleAssignmentService();
