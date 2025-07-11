import type { Request, RequestHandler, Response } from "express";

import { eventService } from "@/api/event/eventService";

class EventController {
	public getEvents: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await eventService.findAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createEvent: RequestHandler = async (req: Request, res: Response) => {
		const { title, description, startDateTime, endDateTime, location } = req.body;
		const parsedStartDateTime = new Date(startDateTime);
		const parsedEndDateTime = new Date(endDateTime);
		const serviceResponse = await eventService.create({
			title,
			description,
			startDateTime: parsedStartDateTime,
			endDateTime: parsedEndDateTime,
			location,
		});
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateEvent: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const { title, description, startDateTime, endDateTime, location } = req.body;
		const parsedStartDateTime = new Date(startDateTime);
		const parsedEndDateTime = new Date(endDateTime);
		const serviceResponse = await eventService.update(Number(id), {
			title,
			description,
			startDateTime: parsedStartDateTime,
			endDateTime: parsedEndDateTime,
			location,
		});
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateEventStatus: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const { state } = req.body;
		const serviceResponse = await eventService.updateStatus(Number(id), state);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteEvent: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const serviceResponse = await eventService.delete(Number(id));
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const eventController = new EventController();
