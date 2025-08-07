import type { Request, RequestHandler, Response } from 'express';

import { peopleRoleService } from '@/api/peopleRole/peopleRoleService';

class PeopleRoleController {
  public getPeopleRoles: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await peopleRoleService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getPeopleRole: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await peopleRoleService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public createPeopleRole: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await peopleRoleService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public deletePeopleRole: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await peopleRoleService.deleteById(id);
    res.status(serviceResponse.statusCode).json(serviceResponse);
  };

  public updatePeopleRole: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id as string, 10);
    const serviceResponse = await peopleRoleService.updateById(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const peopleRoleController = new PeopleRoleController();
