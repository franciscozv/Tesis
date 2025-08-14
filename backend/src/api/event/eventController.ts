import type { Request, RequestHandler, Response } from "express";

import { eventService } from "@/api/event/eventService";

class EventController {
	public getEvents: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await eventService.findAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getEventById: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const serviceResponse = await eventService.findById(Number(id));
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createEvent: RequestHandler = async (req: Request, res: Response) => {
		const { title, description, startDateTime, endDateTime, placeId, eventTypeId } = req.body;
		const parsedStartDateTime = new Date(startDateTime);
		const parsedEndDateTime = new Date(endDateTime);
		const serviceResponse = await eventService.create({
			title,
			description,
			startDateTime: parsedStartDateTime,
			endDateTime: parsedEndDateTime,
			placeId: Number(placeId),
			eventTypeId: Number(eventTypeId),
		});
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateEvent: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const { title, description, startDateTime, endDateTime, placeId, eventTypeId } = req.body;
		const parsedStartDateTime = startDateTime ? new Date(startDateTime) : undefined;
		const parsedEndDateTime = endDateTime ? new Date(endDateTime) : undefined;
		const serviceResponse = await eventService.update(Number(id), {
			title,
			description,
			startDateTime: parsedStartDateTime,
			endDateTime: parsedEndDateTime,
			placeId : placeId ? Number(placeId) : undefined,
			eventTypeId: eventTypeId ? Number(eventTypeId) : undefined,
		});
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateEventStatus: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const { state, reviewComment } = req.body;
		const serviceResponse = await eventService.updateStatus(Number(id), state, reviewComment);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteEvent: RequestHandler = async (req: Request, res: Response) => {
		const { id } = req.params;
		const serviceResponse = await eventService.delete(Number(id));
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getPendingEvents: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await eventService.findAllPending();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public countApprovedEventsByMonth: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await eventService.countApprovedEventsByMonth();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const eventController = new EventController();
