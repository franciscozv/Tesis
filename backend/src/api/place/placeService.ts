// placeService.ts
import { StatusCodes } from "http-status-codes";
import type { Place } from "@/api/place/placeModel";
import { PlaceRepository } from "@/api/place/placeRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class PlaceService {
  private placeRepository: PlaceRepository;

  constructor(repository: PlaceRepository = new PlaceRepository()) {
    this.placeRepository = repository;
  }

  async findAll(): Promise<ServiceResponse<Place[] | null>> {
    try {
      const places = await this.placeRepository.findAllAsync();
      return ServiceResponse.success<Place[]>("Places found", places);
    } catch (ex) {
      const errorMessage = `Error finding all places: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving places.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findById(id: number): Promise<ServiceResponse<Place | null>> {
    try {
      const place = await this.placeRepository.findByIdAsync(id);
      if (!place) {
        return ServiceResponse.failure("Place not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Place>("Place found", place);
    } catch (ex) {
      const errorMessage = `Error finding place with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding place.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async create(data: Omit<Place, "id" | "createdAt" | "updatedAt">): Promise<ServiceResponse<Place | null>> {
    try {
      const newPlace = await this.placeRepository.createAsync(data);
      return ServiceResponse.success<Place>("Place created", newPlace, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error creating place: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating the place.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteById(id: number): Promise<ServiceResponse<null>> {
    try {
      await this.placeRepository.deleteByIdAsync(id);
      return ServiceResponse.success("Place deleted successfully", null, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error deleting place with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting the place.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateById(id: number, data: Partial<Omit<Place, "id" | "createdAt" | "updatedAt">>): Promise<ServiceResponse<Place | null>> {
    try {
      const updatedPlace = await this.placeRepository.updateByIdAsync(id, data);
      if (!updatedPlace) {
        return ServiceResponse.failure("Place not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Place updated successfully", updatedPlace);
    } catch (ex) {
      logger.error(`Error updating place with id ${id}: ${(ex as Error).message}`);
      return ServiceResponse.failure(
        "An error occurred while updating the place.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const placeService = new PlaceService();
