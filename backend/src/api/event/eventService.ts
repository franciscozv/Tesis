import { StatusCodes } from "http-status-codes";
import type { Event } from "@prisma/client";
import { CreateEventInput } from "./eventModel";
import { EventRepository } from "@/api/event/eventRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class EventService {
  private eventRepository: EventRepository;

  constructor(repository: EventRepository = new EventRepository()) {
    this.eventRepository = repository;
  }
  async findAll(): Promise<ServiceResponse<Event[] | null>> {
    try {
      const events = await this.eventRepository.findAllAsync();
      if (!events || events.length === 0) {
        return ServiceResponse.failure(
          "No Events found",
          null,
          StatusCodes.NOT_FOUND
        );
      }
      return ServiceResponse.success<Event[]>("Events found", events);
    } catch (ex) {
      const errorMessage = `Error finding all events: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving events.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
  async create(data: CreateEventInput): Promise<ServiceResponse<Event | null>> {
    try {
      const newEvent = await this.eventRepository.createAsync({
        ...data,
        state: "PENDING",
      });

      return ServiceResponse.success(
        "Event created",
        newEvent,
        StatusCodes.CREATED
      );
    } catch (ex) {
      const errorMessage = `Error finding all events: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving events.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}
export const eventService = new EventService();
