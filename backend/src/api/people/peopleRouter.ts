import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { CreatePeopleSchema, GetPeopleSchema, PeopleSchema, UpdatePeopleSchema } from "@/api/people/peopleModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { peopleController } from "./peopleController";

export const peopleRegistry = new OpenAPIRegistry();
export const peopleRouter: Router = express.Router();

peopleRegistry.register("People", PeopleSchema);

peopleRegistry.registerPath({
	method: "get",
	path: "/people",
	tags: ["People"],
	responses: createApiResponse(z.array(PeopleSchema), "Success"),
});

peopleRouter.get("/", peopleController.getPeople);

peopleRegistry.registerPath({
	method: "post",
	path: "/people",
	tags: ["People"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreatePeopleSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(PeopleSchema, "Created"),
});

peopleRouter.post("/", validateRequest(CreatePeopleSchema), peopleController.createPeople);

peopleRegistry.registerPath({
	method: "put",
	path: "/people/{id}",
	tags: ["People"],
	request: {
		params: UpdatePeopleSchema.shape.params,
		body: {
			content: {
				"application/json": {
					schema: UpdatePeopleSchema.shape.body,
				},
			},
		},
	},
	responses: createApiResponse(PeopleSchema, "Updated"),
});

peopleRouter.put("/:id", validateRequest(UpdatePeopleSchema), peopleController.updatePeople);

peopleRegistry.registerPath({
	method: "delete",
	path: "/people/{id}",
	tags: ["People"],
	request: { params: GetPeopleSchema.shape.params },
	responses: createApiResponse(PeopleSchema, "Deleted"),
});

peopleRouter.delete("/:id", validateRequest(GetPeopleSchema), peopleController.deletePeople);
