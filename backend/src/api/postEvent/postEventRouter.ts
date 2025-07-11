import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { postEventController } from "./postEventController";
import { CreatePostEventSchema, PostEventSchema } from "./postEventModel";

export const postEventRegistry = new OpenAPIRegistry();
export const postEventRouter: Router = express.Router();

postEventRegistry.register("PostEvent", PostEventSchema);

postEventRegistry.registerPath({
	method: "post",
	path: "/post-events",
	tags: ["PostEvent"],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: CreatePostEventSchema.extend({
						photo: z.string().openapi({ type: "string", format: "binary" }),
					}),
				},
			},
		},
	},
	responses: createApiResponse(PostEventSchema, "Created"),
});

postEventRouter.post("/", postEventController.createPostEvent);
