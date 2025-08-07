import { StatusCodes } from "http-status-codes";
import type { PeopleRole } from "@/api/peopleRole/peopleRoleModel";
import { PeopleRoleRepository } from "./peopleRoleRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class PeopleRoleService {
  private peopleRoleRepository: PeopleRoleRepository;

  constructor(repository: PeopleRoleRepository = new PeopleRoleRepository()) {
    this.peopleRoleRepository = repository;
  }

  async findAll(): Promise<ServiceResponse<PeopleRole[] | null>> {
    try {
      const peopleRoles = await this.peopleRoleRepository.findAllAsync();
      return ServiceResponse.success<PeopleRole[]>("People roles found", peopleRoles);
    } catch (ex) {
      const errorMessage = `Error finding all people roles: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving people roles.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: number): Promise<ServiceResponse<PeopleRole | null>> {
    try {
      const peopleRole = await this.peopleRoleRepository.findByIdAsync(id);
      if (!peopleRole) {
        return ServiceResponse.failure("People role not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<PeopleRole>("People role found", peopleRole);
    } catch (ex) {
      const errorMessage = `Error finding people role with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding people role.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async create(data: Omit<PeopleRole, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<PeopleRole | null>> {
    try {
      if (!data.name) {
        return ServiceResponse.failure("Name is required", null, StatusCodes.BAD_REQUEST);
      }

      const newPeopleRole = await this.peopleRoleRepository.createAsync(data);

      return ServiceResponse.success<PeopleRole>("People role created", newPeopleRole, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error creating people role: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating the people role.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteById(id: number): Promise<ServiceResponse<null>> {
    try {
      const existingPeopleRole = await this.peopleRoleRepository.findByIdAsync(id);
      if (!existingPeopleRole) {
        return ServiceResponse.failure("People role not found", null, StatusCodes.NOT_FOUND);
      }

      await this.peopleRoleRepository.deleteByIdAsync(id);
      return ServiceResponse.success<null>("People role deleted", null);
    } catch (ex) {
      const errorMessage = `Error deleting people role with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while deleting the people role.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async updateById(id: number, data: Partial<Omit<PeopleRole, "id" | "createdAt" | "updatedAt">>): Promise<ServiceResponse<PeopleRole | null>> {
    try {
      const existingPeopleRole = await this.peopleRoleRepository.findByIdAsync(id);
      if (!existingPeopleRole) {
        return ServiceResponse.failure("People role not found", null, StatusCodes.NOT_FOUND);
      }

      const updatedPeopleRole = await this.peopleRoleRepository.updateByIdAsync(id, data);
      if (!updatedPeopleRole) {
        return ServiceResponse.failure("Failed to update people role", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }

      return ServiceResponse.success<PeopleRole>("People role updated", updatedPeopleRole);
    } catch (ex) {
      const errorMessage = `Error updating people role with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating the people role.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const peopleRoleService = new PeopleRoleService();