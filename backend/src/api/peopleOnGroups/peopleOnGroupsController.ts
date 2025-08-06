import { Request, Response } from 'express';
import { PeopleOnGroupsService } from './peopleOnGroupsService';
import { PeopleOnGroupsSchema } from './peopleOnGroupsModel';

export class PeopleOnGroupsController {
  constructor(private readonly service: PeopleOnGroupsService) {}

  async addPersonToGroup(req: Request, res: Response) {
    const validatedData = PeopleOnGroupsSchema.parse(req.body);
    const result = await this.service.addPersonToGroup(validatedData);
    res.status(201).json(result);
  }

  async getPeopleInGroup(req: Request, res: Response) {
    const groupId = parseInt(req.params.groupId, 10);
    const result = await this.service.getPeopleInGroup(groupId);
    res.status(200).json(result);
  }

  async removePersonFromGroup(req: Request, res: Response) {
    const personId = parseInt(req.params.personId, 10);
    const groupId = parseInt(req.params.groupId, 10);
    await this.service.removePersonFromGroup(personId, groupId);
    res.status(204).send();
  }

  async updatePersonInGroup(req: Request, res: Response) {
    const personId = parseInt(req.params.personId, 10);
    const groupId = parseInt(req.params.groupId, 10);
    const result = await this.service.updatePersonInGroup(personId, groupId, req.body);
    res.status(200).json(result);
  }
}