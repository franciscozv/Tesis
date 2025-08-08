import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { GetGroupSchema, GroupSchema, UpdateGroupSchema, CreateGroupSchema } from "@/api/group/groupModel";
import { groupController } from "./groupController";
import { GetPeopleInGroupSchema, AddPersonToGroupSchema, PeopleOnGroupsSchema, RemovePersonFromGroupSchema, UpdatePersonInGroupSchema } from "@/api/peopleOnGroups/peopleOnGroupsModel";
import { peopleOnGroupsController } from "@/api/peopleOnGroups/peopleOnGroupsController";
import { validateRequest } from "@/common/utils/httpHandlers";
import {
  AssignRoleToGroupSchema,
  GroupRoleAssignmentSchema,
  RemoveRoleFromGroupSchema,
} from "@/api/groupRoleAssignment/groupRoleAssignmentModel";
import { groupRoleAssignmentController } from "@/api/groupRoleAssignment/groupRoleAssignmentController";
import { GetRolesForGroupSchema } from "@/api/groupRoleAssignment/groupRoleAssignmentModel";

export const groupRegistry = new OpenAPIRegistry();
export const groupRouter: Router = express.Router();

groupRegistry.register("Group", GroupSchema);
groupRegistry.register("PeopleOnGroups", PeopleOnGroupsSchema);
groupRegistry.register("GroupRoleAssignment", GroupRoleAssignmentSchema);

// --- Group Routes ---

groupRegistry.registerPath({
  method: "get",
  path: "/groups",
  tags: ["Group"],
  responses: createApiResponse(z.array(GroupSchema), "Success"),
});
groupRouter.get("/", groupController.getGroups);

groupRegistry.registerPath({
  method: "get",
  path: "/groups/members-count",
  tags: ["Group"],
  responses: createApiResponse(z.array(z.object({ name: z.string(), members: z.number() })), "Success"),
});
groupRouter.get("/members-count", groupController.getMemberCountByGroup);

groupRegistry.registerPath({
  method: "get",
  path: "/groups/{id}",
  tags: ["Group"],
  request: { params: GetGroupSchema.shape.params },
  responses: createApiResponse(GroupSchema, "Success"),
});
groupRouter.get("/:id", validateRequest(GetGroupSchema), groupController.getGroup);

groupRegistry.registerPath({
  method: "post",
  path: "/groups",
  tags: ["Group"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateGroupSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(GroupSchema, "Created"),
});
groupRouter.post("/", validateRequest(CreateGroupSchema), groupController.createGroup);

groupRegistry.registerPath({
  method: "delete",
  path: "/groups/{id}",
  tags: ["Group"],
  request: { params: GetGroupSchema.shape.params },
  responses: {
    204: {
      description: "Group deleted successfully",
    },
    404: {
      description: "Group not found",
    },
  },
});
groupRouter.delete("/:id", validateRequest(GetGroupSchema), groupController.deleteGroup);

groupRegistry.registerPath({
  method: "put",
  path: "/groups/{id}",
  tags: ["Group"],
  request: {
    params: GetGroupSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateGroupSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(GroupSchema, "Updated"),
});
groupRouter.put("/:id", validateRequest(UpdateGroupSchema), groupController.updateGroup);

// --- PeopleOnGroups (Nested) Routes ---

groupRegistry.registerPath({
  method: "post",
  path: "/groups/{groupId}/people",
  tags: ["Group"],
  request: {
    params: AddPersonToGroupSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: AddPersonToGroupSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PeopleOnGroupsSchema, "Created"),
});
groupRouter.post(
  "/:groupId/people",
  validateRequest(AddPersonToGroupSchema),
  peopleOnGroupsController.addPersonToGroup,
);

groupRegistry.registerPath({
  method: "get",
  path: "/groups/{groupId}/people",
  tags: ["Group"],
  request: { params: GetPeopleInGroupSchema.shape.params },
  responses: createApiResponse(z.array(PeopleOnGroupsSchema), "Success"),
});
groupRouter.get(
  "/:groupId/people",
  validateRequest(GetPeopleInGroupSchema),
  peopleOnGroupsController.getPeopleInGroup,
);

groupRegistry.registerPath({
  method: "delete",
  path: "/groups/{groupId}/people/{personId}",
  tags: ["Group"],
  request: { params: RemovePersonFromGroupSchema.shape.params },
  responses: {
    204: {
      description: "Person removed from group successfully",
    },
    404: {
      description: "Person or group not found",
    },
  },
});
groupRouter.delete(
  "/:groupId/people/:personId",
  validateRequest(RemovePersonFromGroupSchema),
  peopleOnGroupsController.removePersonFromGroup,
);

groupRegistry.registerPath({
  method: "put",
  path: "/groups/{groupId}/people/{personId}",
  tags: ["Group"],
  request: {
    params: UpdatePersonInGroupSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdatePersonInGroupSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PeopleOnGroupsSchema, "Updated"),
});
groupRouter.put(
  "/:groupId/people/:personId",
  validateRequest(UpdatePersonInGroupSchema),
  peopleOnGroupsController.updatePersonInGroup,
);

// --- GroupRoleAssignment (Nested) Routes ---

groupRegistry.registerPath({
  method: "post",
  path: "/groups/{groupId}/roles",
  tags: ["Group"],
  request: {
    params: AssignRoleToGroupSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: AssignRoleToGroupSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(GroupRoleAssignmentSchema, "Created"),
});
groupRouter.post(
  "/:groupId/roles",
  validateRequest(AssignRoleToGroupSchema),
  groupRoleAssignmentController.assignRoleToGroup,
);

groupRegistry.registerPath({
  method: "get",
  path: "/groups/{groupId}/roles",
  tags: ["Group"],
  request: { params: GetRolesForGroupSchema.shape.params },
  responses: createApiResponse(z.array(GroupRoleAssignmentSchema), "Success"),
});
groupRouter.get(
  "/:groupId/roles",
  validateRequest(GetRolesForGroupSchema),
  groupRoleAssignmentController.getRolesForGroup,
);

groupRegistry.registerPath({
  method: "delete",
  path: "/groups/{groupId}/roles/{roleId}",
  tags: ["Group"],
  request: { params: RemoveRoleFromGroupSchema.shape.params },
  responses: {
    204: {
      description: "Role removed from group successfully",
    },
    404: {
      description: "Role or group not found",
    },
  },
});
groupRouter.delete(
  "/:groupId/roles/:roleId",
  validateRequest(RemoveRoleFromGroupSchema),
  groupRoleAssignmentController.removeRoleFromGroup,
);
