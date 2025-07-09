import { StatusCodes } from "http-status-codes";
import type { z } from "zod";
import type { PostEvent } from "@prisma/client";
import { PostEventRepository } from "./postEventRepository";
import { EventRepository } from "@/api/event/eventRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";
import type { CreatePostEventSchema } from "./postEventModel";

export class PostEventService {
  private postEventRepository: PostEventRepository;
  private eventRepository: EventRepository;

  constructor(
    postEventRepository: PostEventRepository = new PostEventRepository(),
    eventRepository: EventRepository = new EventRepository()
  ) {
    this.postEventRepository = postEventRepository;
    this.eventRepository = eventRepository;
    console.log("PostEventService constructor called.");
    console.log("this.postEventRepository (constructor):", this.postEventRepository);
    console.log("this.eventRepository (constructor):", this.eventRepository);
    this.create = this.create.bind(this); // Explicitly bind 'create' method
  }

  async create(
    data: z.infer<typeof CreatePostEventSchema>,
    photoUrl: string
  ): Promise<ServiceResponse<PostEvent | null>> {
    console.log("PostEventService create method called.");
    console.log("this (inside create method):", this);
    console.log("this.postEventRepository (inside create method):", this.postEventRepository);
    console.log("this.eventRepository (inside create method):", this.eventRepository);

    try {
      const { comment, conclution, eventId } = data;

      if (!this.eventRepository) {
        console.error("eventRepository is undefined in PostEventService.create");
        return ServiceResponse.failure(
          "Internal Server Error: Event repository not initialized.",
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      const event = await this.eventRepository.findByIdAsync(eventId);

      if (!event) {
        return ServiceResponse.failure(
          "Event not found.",
          null,
          StatusCodes.NOT_FOUND
        );
      }

      if (event.state !== "APPROVED") {
        return ServiceResponse.failure(
          "Cannot create PostEvent for an event that is not APPROVED.",
          null,
          StatusCodes.BAD_REQUEST
        );
      }

      if (!this.postEventRepository) {
        console.error("postEventRepository is undefined in PostEventService.create");
        return ServiceResponse.failure(
          "Internal Server Error: PostEvent repository not initialized.",
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      console.log("Calling postEventRepository.createAsync...");
      const newPostEvent = await this.postEventRepository.createAsync({
        comment,
        conclution,
        photoUrl,
        event: {
          connect: { id: eventId },
        },
      });

      return ServiceResponse.success(
        "PostEvent created",
        newPostEvent,
        StatusCodes.CREATED
      );
    } catch (ex) {
      const errorMessage = `Error creating PostEvent: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        `An error occurred while creating the PostEvent: ${errorMessage}`,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const postEventService = new PostEventService();
