import { StatusCodes } from "http-status-codes";
import type { EventType } from "@/api/eventType/eventTypeModel";
import { EventTypeRepository } from "@/api/eventType/eventTypeRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";


export class EventTypeService {
  private eventTypeRepository: EventTypeRepository;

  constructor(repository: EventTypeRepository = new EventTypeRepository()) {
    this.eventTypeRepository = repository;
  }

  async findAll(): Promise<ServiceResponse<EventType[] | null>> {
    try {
      const eventTypes = await this.eventTypeRepository.findAllAsync();
      if (!eventTypes) {
        return ServiceResponse.failure(
          "An error occurred while retrieving event types.",
          null,
          StatusCodes.INTERNAL_SERVER_ERROR,
        );
      }
      return ServiceResponse.success<EventType[]>("Event types found", eventTypes);
    } catch (ex) {
      const errorMessage = `Error finding all event types: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving event types.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findById(id: number): Promise<ServiceResponse<EventType | null>> {
    try {
      const eventType = await this.eventTypeRepository.findByIdAsync(id);
      if (!eventType) {
        return ServiceResponse.failure("Event type not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<EventType>("Event type found", eventType);
    } catch (ex) {
      const errorMessage = `Error finding event type with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while finding event type.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async create(data: { name: string; description: string; color: string }): Promise<ServiceResponse<EventType | null>> {
    try {
      const { name, description, color } = data;

      if (!name || !description || !color) {
        return ServiceResponse.failure("Name, color and description are required", null, StatusCodes.BAD_REQUEST);
      }

      const newEventType = await this.eventTypeRepository.createAsync({ name, description, color });
      return ServiceResponse.success<EventType>("Event type created successfully", newEventType);
    } catch (ex) {
      const errorMessage = `Error creating event type: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while creating event type.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteById(id: number): Promise<ServiceResponse<null>> {
    try {
      const deleted = await this.eventTypeRepository.deleteByIdAsync(id);
      if (!deleted) {
        return ServiceResponse.failure("Event type not found or could not be deleted", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Event type deleted successfully", null, StatusCodes.OK);
    } catch (ex) {
      logger.error(`Error deleting group with id ${id}: ${(ex as Error).message}`);
			return ServiceResponse.failure(
				"An error occurred while deleting the event type.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
    }
  }

  async updateById(id: number, data: { name: string; description: string; color: string }): Promise<ServiceResponse<EventType | null>> {
    try {
      const updatedEventType = await this.eventTypeRepository.updateByIdAsync(id, data);
      if (!updatedEventType) {
        return ServiceResponse.failure("Event type not found or could not be updated", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<EventType>("Event type updated successfully", updatedEventType);
    } catch (ex) {
      const errorMessage = `Error updating event type with id ${id}: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure("An error occurred while updating event type.", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

}

export const eventTypeService = new EventTypeService();