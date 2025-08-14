import { StatusCodes } from "http-status-codes";
import type { z } from "zod";
import type { Event, State } from "@prisma/client";
import type { CreateEventSchema, UpdateEventInput } from "./eventModel";
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
			if (!events) {
				return ServiceResponse.failure(
					"An error occurred while retrieving groups.",
					null,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}
			return ServiceResponse.success<Event[]>("Events found", events);
		} catch (ex) {
			const errorMessage = `Error finding all events: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving events.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findById(id: number): Promise<ServiceResponse<Event | null>> {
		try {
			const event = await this.eventRepository.findByIdAsync(id);
			if (!event) {
				return ServiceResponse.failure("Event not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success<Event>("Event found", event);
		} catch (ex) {
			const errorMessage = `Error finding event by id: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving the event.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
	async create(data: z.infer<typeof CreateEventSchema>): Promise<ServiceResponse<Event | null>> {
		try {
			const { title, description, startDateTime, endDateTime, placeId, eventTypeId } = data;

			const newEvent = await this.eventRepository.createAsync({
				title,
				description,
				startDateTime,
				endDateTime,
				place: { connect: { id: placeId } },
				eventType: { connect: { id: eventTypeId } },
			});

			return ServiceResponse.success("Event created", newEvent, StatusCodes.CREATED);
		} catch (ex) {
			const errorMessage = `Error creating event: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				`An error occurred while creating the event: ${errorMessage}`,
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async update(id: number, data: UpdateEventInput): Promise<ServiceResponse<Event | null>> {
		try {
			const { title, description, placeId, startDateTime, endDateTime, eventTypeId } = data;

			const updateData: any = {
				title,
				description,
				startDateTime,
				endDateTime,
			};

			if (placeId) {
				updateData.place = { connect: { id: placeId } };
			}

			const updatedEvent = await this.eventRepository.updateAsync(id, updateData);
			if (!updatedEvent) {
				return ServiceResponse.failure("Event not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success("Event updated", updatedEvent, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error updating event: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating the event.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateStatus(id: number, state: State, reviewComment?: string): Promise<ServiceResponse<Event | null>> {
		try {
			const updatedEvent = await this.eventRepository.updateAsync(id, {
				state,
				reviewComment,
			});
			if (!updatedEvent) {
				return ServiceResponse.failure("Event not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success("Event status updated", updatedEvent, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error updating event status: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while updating the event status.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async delete(id: number): Promise<ServiceResponse<Event | null>> {
		try {
			const deletedEvent = await this.eventRepository.deleteByIdAsync(id);
			if (!deletedEvent) {
				return ServiceResponse.failure("Event not found", null, StatusCodes.NOT_FOUND);
			}
			return ServiceResponse.success("Event deleted", deletedEvent, StatusCodes.OK);
		} catch (ex) {
			const errorMessage = `Error deleting event: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while deleting the event.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async findAllPending(): Promise<ServiceResponse<Event[] | null>> {
		try {
			const events = await this.eventRepository.findAllPendingAsync();
			if (!events) {
				return ServiceResponse.failure(
					"An error occurred while retrieving pending events.",
					null,
					StatusCodes.INTERNAL_SERVER_ERROR,
				);
			}
			return ServiceResponse.success<Event[]>("Pending events found", events);
		} catch (ex) {
			const errorMessage = `Error finding pending events: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while retrieving pending events.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async countApprovedEventsByMonth(): Promise<ServiceResponse<any>> {
		try {
			const result = await this.eventRepository.countApprovedEventsByMonth();
			return ServiceResponse.success("Event count by month", result);
		} catch (ex) {
			const errorMessage = `Error counting approved events by month: ${(ex as Error).message}`;
			logger.error(errorMessage);
			return ServiceResponse.failure(
				"An error occurred while counting approved events by month.",
				null,
				StatusCodes.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
export const eventService = new EventService();
