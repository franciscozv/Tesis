import type { Request, RequestHandler, Response } from "express";

import { placeService } from "@/api/place/placeService";

class PlaceController {
  public getPlaces: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await placeService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getPlace: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await placeService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createPlace: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await placeService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deletePlace: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await placeService.deleteById(id);
    res.status(serviceResponse.statusCode).json(serviceResponse);
  };

  public updatePlace: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await placeService.updateById(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const placeController = new PlaceController();
