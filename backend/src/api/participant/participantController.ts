import type { Request, RequestHandler, Response } from "express";

import { participantService } from "@/api/participant/participantService";

class ParticipantController {
  public getParticipants: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await participantService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getParticipantById: RequestHandler = async (req: Request, res: Response) => {
    const { id } = req.params;
    const serviceResponse = await participantService.findById(Number(id));
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createParticipant: RequestHandler = async (req: Request, res: Response) => {
    const { eventId, personId, responsibilityId } = req.body;
    const serviceResponse = await participantService.create({
      eventId: Number(eventId),
      personId: Number(personId),
      responsibilityId: Number(responsibilityId),
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public updateParticipant: RequestHandler = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { eventId, personId, responsibilityId } = req.body;
    const serviceResponse = await participantService.update(Number(id), {
      eventId: eventId ? Number(eventId) : undefined,
      personId: personId ? Number(personId) : undefined,
      responsibilityId: responsibilityId ? Number(responsibilityId) : undefined,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deleteParticipant: RequestHandler = async (req: Request, res: Response) => {
    const { id } = req.params;
    const serviceResponse = await participantService.delete(Number(id));
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const participantController = new ParticipantController();
