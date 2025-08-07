import type { Request, RequestHandler, Response } from "express";

import { peopleOnGroupsService } from "@/api/peopleOnGroups/peopleOnGroupsService";

class PeopleOnGroupsController {
  public addPersonToGroup: RequestHandler = async (req: Request, res: Response) => {
    const groupId = Number.parseInt(req.params.groupId as string, 10);
    const serviceResponse = await peopleOnGroupsService.addPersonToGroup({ ...req.body, groupId });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getPeopleInGroup: RequestHandler = async (req: Request, res: Response) => {
    const groupId = Number.parseInt(req.params.groupId as string, 10);
    const serviceResponse = await peopleOnGroupsService.getPeopleInGroup(groupId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public removePersonFromGroup: RequestHandler = async (req: Request, res: Response) => {
    const groupId = Number.parseInt(req.params.groupId as string, 10);
    const personId = Number.parseInt(req.params.personId as string, 10);
    const serviceResponse = await peopleOnGroupsService.removePersonFromGroup(personId, groupId);
    res.status(serviceResponse.statusCode).json(serviceResponse);
  };

  public updatePersonInGroup: RequestHandler = async (req: Request, res: Response) => {
    const groupId = Number.parseInt(req.params.groupId as string, 10);
    const personId = Number.parseInt(req.params.personId as string, 10);
    const serviceResponse = await peopleOnGroupsService.updatePersonInGroup(personId, groupId, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const peopleOnGroupsController = new PeopleOnGroupsController();
