import type { CreateResponsibilityInput } from "./responsibilityModel";
import type { Request, RequestHandler, Response } from "express";

import { responsibilityService } from "@/api/responsibility/responsibilityService";

class ResponsibilityController {
	public getResponsibilities: RequestHandler = async (_req: Request, res: Response) => {
		const serviceResponse = await responsibilityService.findAll();
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public CreateResponsibility: RequestHandler = async (req: Request, res: Response) => {
		const { name, description } = req.body;
		const serviceResponse = await responsibilityService.create({
			name,
			description,
		});
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteResponsibility: RequestHandler = async (req: Request, res: Response) => {
		const id = Number.parseInt(req.params.id as string, 10);
		const serviceResponse = await responsibilityService.deleteById(id);
		res.status(serviceResponse.statusCode).json(serviceResponse);
	};

	public updateResponsibility: RequestHandler = async (req: Request, res: Response) => {
		const id = Number.parseInt(req.params.id as string, 10);
		const { name, description } = req.body as CreateResponsibilityInput;
		const serviceResponse = await responsibilityService.updateById(id, {
			name,
			description,
		});
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const responsibilityController = new ResponsibilityController();
