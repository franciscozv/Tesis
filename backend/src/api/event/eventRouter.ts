import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { eventController } from "./eventController";
import {
	CreateEventSchema,
	EventSchema,
	CreateEventRequestSchema,
	UpdateEventSchema,
	UpdateEventStatusRequestSchema,
	UpdateEventStatusSchema,
} from "./eventModel";

export const eventRegistry = new OpenAPIRegistry();
export const eventRouter: Router = express.Router();

eventRegistry.register("Event", EventSchema);

eventRegistry.registerPath({
	method: "get",
	path: "/events",
	tags: ["Event"],
	responses: createApiResponse(z.array(EventSchema), "Success"),
});

eventRouter.get("/", eventController.getEvents);

eventRegistry.registerPath({
	method: "get",
	path: "/events/{id}",
	tags: ["Event"],
	request: {
		params: z.object({
			id: z.number(),
		}),
	},
	responses: createApiResponse(EventSchema, "Success"),
});

eventRouter.get("/:id", eventController.getEventById);

eventRegistry.registerPath({
	method: "post",
	path: "/events",
	tags: ["Event"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateEventSchema,
				},
			},
		},
	},
	responses: createApiResponse(EventSchema, "Created"),
});

eventRouter.post("/", validateRequest(CreateEventRequestSchema), eventController.createEvent);

eventRegistry.registerPath({
	method: "put",
	path: "/events/{id}",
	tags: ["Event"],
	request: {
		params: z.object({
			id: z.number(),
		}),
		body: {
			content: {
				"application/json": {
					schema: UpdateEventSchema,
				},
			},
		},
	},
	responses: createApiResponse(EventSchema, "Updated"),
});

eventRouter.put("/:id", validateRequest(z.object({ body: UpdateEventSchema })), eventController.updateEvent);

eventRegistry.registerPath({
	method: "patch",
	path: "/events/{id}/status",
	tags: ["Event"],
	request: {
		params: z.object({
			id: z.number(),
		}),
		body: {
			content: {
				"application/json": {
					schema: UpdateEventStatusSchema,
				},
			},
		},
	},
	responses: createApiResponse(EventSchema, "Updated"),
});

eventRouter.patch("/:id/status", validateRequest(UpdateEventStatusRequestSchema), eventController.updateEventStatus);

eventRegistry.registerPath({
	method: "delete",
	path: "/events/{id}",
	tags: ["Event"],
	request: {
		params: z.object({
			id: z.number(),
		}),
	},
	responses: createApiResponse(EventSchema, "Deleted"),
});

eventRouter.delete("/:id", eventController.deleteEvent);

eventRegistry.registerPath({
	method: "get",
	path: "/events/pending",
	tags: ["Event"],
	responses: createApiResponse(z.array(EventSchema), "Success"),
});

eventRouter.get("/pending", eventController.getPendingEvents);
