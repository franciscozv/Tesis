import { StatusCodes } from "http-status-codes";
import type { z } from "zod";
import type { Participant } from "@prisma/client";
import type { CreateParticipantSchema, UpdateParticipantInput } from "./participantModel";
import { ParticipantRepository } from "@/api/participant/participantRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { logger } from "@/server";

export class ParticipantService {
  private participantRepository: ParticipantRepository;

  constructor(repository: ParticipantRepository = new ParticipantRepository()) {
    this.participantRepository = repository;
  }

  async findAll(): Promise<ServiceResponse<Participant[] | null>> {
    try {
      const participants = await this.participantRepository.findAllAsync();
      if (!participants) {
        return ServiceResponse.failure(
          "An error occurred while retrieving participants.",
          null,
          StatusCodes.INTERNAL_SERVER_ERROR
        );
      }
      return ServiceResponse.success<Participant[]>("Participants found", participants);
    } catch (ex) {
      const errorMessage = `Error finding all participants: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving participants.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findById(id: number): Promise<ServiceResponse<Participant | null>> {
    try {
      const participant = await this.participantRepository.findByIdAsync(id);
      if (!participant) {
        return ServiceResponse.failure("Participant not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success<Participant>("Participant found", participant);
    } catch (ex) {
      const errorMessage = `Error finding participant by id: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving the participant.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async create(data: z.infer<typeof CreateParticipantSchema>): Promise<ServiceResponse<Participant | null>> {
    try {
      const { eventId, personId, responsibilityId } = data;

      const newParticipant = await this.participantRepository.createAsync({
        eventId,
        personId,
        responsibilityId,
      });

      return ServiceResponse.success("Participant created", newParticipant, StatusCodes.CREATED);
    } catch (ex) {
      const errorMessage = `Error creating participant: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        `An error occurred while creating the participant: ${errorMessage}`,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async update(id: number, data: UpdateParticipantInput): Promise<ServiceResponse<Participant | null>> {
    try {
      const { eventId, personId, responsibilityId } = data;

      const updateData: any = {};

      if (eventId) {
        updateData.event = { connect: { id: eventId } };
      }
      if (personId) {
        updateData.person = { connect: { id: personId } };
      }
      if (responsibilityId) {
        updateData.responsibility = { connect: { id: responsibilityId } };
      }

      const updatedParticipant = await this.participantRepository.updateAsync(id, updateData);
      if (!updatedParticipant) {
        return ServiceResponse.failure("Participant not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Participant updated", updatedParticipant, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error updating participant: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while updating the participant.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async delete(id: number): Promise<ServiceResponse<Participant | null>> {
    try {
      const deletedParticipant = await this.participantRepository.deleteByIdAsync(id);
      if (!deletedParticipant) {
        return ServiceResponse.failure("Participant not found", null, StatusCodes.NOT_FOUND);
      }
      return ServiceResponse.success("Participant deleted", deletedParticipant, StatusCodes.OK);
    } catch (ex) {
      const errorMessage = `Error deleting participant: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while deleting the participant.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const participantService = new ParticipantService();
