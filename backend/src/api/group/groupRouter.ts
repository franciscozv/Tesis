import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { GetGroupSchema, GroupSchema, UpdateGroupSchema, CreateGroupSchema } from "@/api/group/groupModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { groupController } from "./groupController";

export const groupRegistry = new OpenAPIRegistry();
export const groupRouter: Router = express.Router();

groupRegistry.register("Group", GroupSchema);

groupRegistry.registerPath({
	method: "get",
	path: "/groups",
	tags: ["Group"],
	responses: createApiResponse(z.array(GroupSchema), "Success"),
});

groupRouter.get("/", groupController.getGroups);

groupRegistry.registerPath({
	method: "get",
	path: "/groups/{id}",
	tags: ["Group"],
	request: { params: GetGroupSchema.shape.params },
	responses: createApiResponse(GroupSchema, "Success"),
});

groupRouter.get("/:id", validateRequest(GetGroupSchema), groupController.getGroup);

// OpenAPI registry
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

// Express route
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
