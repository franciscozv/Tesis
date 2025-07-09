import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import { ResponsibilityRepository } from "./responsibilityRespository";
import type { CreateResponsibilityInput } from "./responsibilityModel";
import type { Responsibility } from "./responsibilityModel";
export class ResponsibilityService {
	private responsibilityRepository: ResponsibilityRepository;

	constructor(repository: ResponsibilityRepository = new ResponsibilityRepository()) {
		this.responsibilityRepository = repository;
	}

	// Retrieves all responsibilities from the database
	async findAll(): Promise<ServiceResponse<Responsibility[] | null>> {
		try {
			const responsibilities = await this.responsibilityRepository.findAllAsync();
			if (!responsibilities) {
				return ServiceResponse.failure(
					"An error occurred while retrieving responsibilities.",
					null,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}
			return ServiceResponse.success<Responsibility[]>("Responsibilities found", responsibilities);
		} catch (ex) {
			const errorMessage = `Error finding all responsibilities: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving responsibilities.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async create(data: CreateResponsibilityInput): Promise<ServiceResponse<Responsibility | null>> {
		try {
			const responsibility = await this.responsibilityRepository.createAsync(data);
			if (!responsibility) {
				return ServiceResponse.failure("Failed to create responsibility", null, StatusCodes.BAD_REQUEST);
			}
			return ServiceResponse.success<Responsibility>("Responsibility created successfully", responsibility);
		} catch (ex) {
			const errorMessage = `Error creating responsibility: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while creating responsibility.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteById(id: number): Promise<ServiceResponse<null>> {
		try {
			const deletedResponsibility = await this.responsibilityRepository.deleteByIdAsync(id);
			if (!deletedResponsibility) {
				return ServiceResponse.failure("Responsibility not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<null>("Responsibility deleted successfully", null);
		} catch (ex) {
			const errorMessage = `Error deleting responsibility with id ${id}: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting responsibility.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateById(id: number, data: CreateResponsibilityInput): Promise<ServiceResponse<Responsibility | null>> {
		try {
			const updatedResponsibility = await this.responsibilityRepository.updateByIdAsync(id, data);
			if (!updatedResponsibility) {
				return ServiceResponse.failure("Responsibility not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Responsibility>("Responsibility updated successfully", updatedResponsibility);
		} catch (ex) {
			const errorMessage = `Error updating responsibility with id ${id}: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating responsibility.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const responsibilityService = new ResponsibilityService();
