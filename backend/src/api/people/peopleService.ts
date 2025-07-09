import { StatusCodes } from "http-status-codes";

import type { People } from "@/api/people/peopleModel";
import { PeopleRepository } from "@/api/people/peopleRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { CreatePeopleInput, UpdatePeopleInput } from "@/api/people/peopleModel";

export class PeopleService {
	private peopleRepository: PeopleRepository;

	constructor(repository: PeopleRepository = new PeopleRepository()) {
		this.peopleRepository = repository;
	}

	async findAll(): Promise<ServiceResponse<People[] | null>> {
		try {
			const people = await this.peopleRepository.findAllAsync();
			if (!people) {
				return ServiceResponse.failure(
					"An error occurred while retrieving people.",
					null,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}
			return ServiceResponse.success<People[]>("People found", people);
		} catch (ex) {
			const errorMessage = `Error finding all people: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving people.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async create(data: CreatePeopleInput): Promise<ServiceResponse<People | null>> {
		try {
			const people = await this.peopleRepository.createAsync({
				...data,
				baptismDate: new Date(data.baptismDate),
				convertionDate: new Date(data.convertionDate),
				birthdate: new Date(data.birthdate),
			});
			return ServiceResponse.success("Person created successfully", people, StatusCodes.CREATED);
		} catch (ex) {
			const errorMessage = `Error creating person: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while creating the person.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateById(id: number, data: UpdatePeopleInput): Promise<ServiceResponse<People | null>> {
		try {
			const person = await this.peopleRepository.updateByIdAsync(id, data);
			if (!person) {
				return ServiceResponse.failure("Person not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success("Person updated successfully", person);
		} catch (ex) {
			const errorMessage = `Error updating person with ID ${id}: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating the person.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteById(id: number): Promise<ServiceResponse<null>> {
		try {
			const deleted = await this.peopleRepository.deleteByIdAsync(id);
			if (!deleted) {
				return ServiceResponse.failure("Person not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success("Person deleted successfully", null, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error deleting person with ID ${id}: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting the person.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}

export const peopleService = new PeopleService();
