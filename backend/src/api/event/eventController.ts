import type { Request, RequestHandler, Response } from "express";

import { eventService } from "@/api/event/eventService";

class EventController {
  public getEvents: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await eventService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createEvent: RequestHandler = async (req: Request, res: Response) => {
    const {
      title,
      description,
      dateStart,
      dateEnd,
      timeStart,
      timeEnd,
      location,
    } = req.body;
    const serviceResponse = await eventService.create({
      title,
      description,
      dateStart,
      dateEnd,
      timeStart,
      timeEnd,
      location,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const eventController = new EventController();
