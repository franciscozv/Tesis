import type { Request, RequestHandler, Response } from "express";

import { peopleService } from "@/api/people/peopleService";
import type { CreatePeopleInput, UpdatePeopleInput } from "./peopleModel";

class PeopleController {
	public getPeople: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await peopleService.findAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public createPeople: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await peopleService.create(req.body as CreatePeopleInput);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updatePeople: RequestHandler = async (req: Request, res: Response) => {
		const id = Number.parseInt(req.params.id as string, 10);
		const serviceResponse = await peopleService.updateById(id, req.body as UpdatePeopleInput);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deletePeople: RequestHandler = async (req: Request, res: Response) => {
		const id = Number.parseInt(req.params.id as string, 10);
		const serviceResponse = await peopleService.deleteById(id);
		res.status(serviceResponse.statusCode).json(serviceResponse);
	};
}

export const peopleController = new PeopleController();
