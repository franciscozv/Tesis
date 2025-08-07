import type { Request, RequestHandler, Response } from "express";

import { groupRoleAssignmentService } from "@/api/groupRoleAssignment/groupRoleAssignmentService";

class GroupRoleAssignmentController {
  public assignRoleToGroup: RequestHandler = async (req: Request, res: Response) => {
    const groupId = Number.parseInt(req.params.groupId as string, 10);
    const { roleId } = req.body;
    const serviceResponse = await groupRoleAssignmentService.assignRoleToGroup(groupId, roleId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public removeRoleFromGroup: RequestHandler = async (req: Request, res: Response) => {
    const groupId = Number.parseInt(req.params.groupId as string, 10);
    const roleId = Number.parseInt(req.params.roleId as string, 10);
    const serviceResponse = await groupRoleAssignmentService.removeRoleFromGroup(groupId, roleId);
    res.status(serviceResponse.statusCode).json(serviceResponse);
  };

  public getRolesForGroup: RequestHandler = async (req: Request, res: Response) => {
    const groupId = Number.parseInt(req.params.groupId as string, 10);
    const serviceResponse = await groupRoleAssignmentService.getRolesForGroup(groupId);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const groupRoleAssignmentController = new GroupRoleAssignmentController();
