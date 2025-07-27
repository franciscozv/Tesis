import type { Request, RequestHandler, Response } from "express";

import { eventTypeService } from "@/api/eventType/eventTypeService";

class EventTypeController {
    public getEventTypes: RequestHandler = async (_req: Request, res: Response) => {
        const serviceResponse = await eventTypeService.findAll();
        res.status(serviceResponse.statusCode).send(serviceResponse);
    };

    public getEventType: RequestHandler = async (req: Request, res: Response) => {
        const id = Number.parseInt(req.params.id as string, 10);
        const serviceResponse = await eventTypeService.findById(id);
        res.status(serviceResponse.statusCode).send(serviceResponse);
    };

    public createEventType: RequestHandler = async (req: Request, res: Response) => {
        const { name, description, color } = req.body;
        const serviceResponse = await eventTypeService.create({ name, description, color });
        res.status(serviceResponse.statusCode).send(serviceResponse);
    };

    public deleteEventType: RequestHandler = async (req: Request, res: Response) => {
        const id = Number.parseInt(req.params.id as string, 10);
        const serviceResponse = await eventTypeService.deleteById(id);
        res.status(serviceResponse.statusCode).json(serviceResponse);
    };

    public updateEventType: RequestHandler = async (req: Request, res: Response) => {
        const id = Number.parseInt(req.params.id as string, 10);
        const { name, description, color } = req.body;
        const serviceResponse = await eventTypeService.updateById(id, {
            name,
            description,
            color,
        });
        res.status(serviceResponse.statusCode).send(serviceResponse);
    };
}

export const eventTypeController = new EventTypeController();