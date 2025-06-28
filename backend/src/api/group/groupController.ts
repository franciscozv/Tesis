import type { Request, RequestHandler, Response } from "express";

import { groupService } from "@/api/group/groupService";

class GroupController {
  public getGroups: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await groupService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getGroup: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await groupService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createGroup: RequestHandler = async (req: Request, res: Response) => {
    const { name, description } = req.body;
    const serviceResponse = await groupService.create({ name, description });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deleteGroup: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await groupService.deleteById(id);
    res.status(serviceResponse.statusCode).json(serviceResponse);
  };

  public updateGroup: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const { name, description } = req.body;
    const serviceResponse = await groupService.updateById(id, {
      name,
      description,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const groupController = new GroupController();
