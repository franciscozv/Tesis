// groupService.ts
import { StatusCodes } from "http-status-codes";
import type { Group } from "@/api/group/groupModel";
import { GroupRepository } from "@/api/group/groupRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class GroupService {
	private groupRepository: GroupRepository;

	constructor(repository: GroupRepository = new GroupRepository()) {
		this.groupRepository = repository;
	}

	async findAll(): Promise<ServiceResponse<Group[] | null>> {
		try {
			const groups = await this.groupRepository.findAllAsync();
			return ServiceResponse.success<Group[]>("Groups found", groups);
		} catch (ex) {
			const errorMessage = `Error finding all groups: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving groups.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findById(id: number): Promise<ServiceResponse<Group | null>> {
		try {
			const group = await this.groupRepository.findByIdAsync(id);
			if (!group) {
				return ServiceResponse.failure("Group not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Group>("Group found", group);
		} catch (ex) {
			const errorMessage = `Error finding group with id ${id}: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure("An error occurred while finding group.", null, StatusCodes.INTERNAL_SERVER_ERROR);
		}
	}

	async create(data: Omit<Group, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<Group | null>> {
		try {
			if (!data.name) {
				return ServiceResponse.failure("Name is required", null, StatusCodes.BAD_REQUEST);
			}

			const newGroup = await this.groupRepository.createAsync(data);

			return ServiceResponse.success<Group>("Group created", newGroup, StatusCodes.CREATED);
		} catch (ex) {
			const errorMessage = `Error creating group: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while creating the group.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteById(id: number): Promise<ServiceResponse<null>> {
		try {
			await this.groupRepository.deleteByIdAsync(id);
			return ServiceResponse.success("Group deleted successfully", null, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error deleting group with id ${id}: ${(ex as Error).message}`;
			logger.error(errorMessage);
      if ((ex as Error).message.includes("with members")) {
        return ServiceResponse.failure(
					"Cannot delete a group with members.",
					null,
					StatusCodes.BAD_REQUEST,
				);
      }
			return ServiceResponse.failure(
				"An error occurred while deleting the group.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateById(id: number, data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>): Promise<ServiceResponse<Group | null>> {
		try {
			const updatedGroup = await this.groupRepository.updateByIdAsync(id, data);
			if (!updatedGroup) {
				return ServiceResponse.failure("Group not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success("Group updated successfully", updatedGroup);
		} catch (ex) {
			logger.error(`Error updating group with id ${id}: ${(ex as Error).message}`);
			return ServiceResponse.failure(
				"An error occurred while updating the group.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getMemberCountByGroup(): Promise<ServiceResponse<{ name: string; members: number }[] | null>> {
		try {
			const groups = await this.groupRepository.findAllAsync();
			const memberCount = groups.map((group) => ({
				name: group.name,
				members: group._count.members,
			}));
			return ServiceResponse.success("Member count by group found", memberCount);
		} catch (ex) {
			const errorMessage = `Error getting member count by group: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while getting member count by group.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const groupService = new GroupService();