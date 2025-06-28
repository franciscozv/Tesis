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

eventRouter.post(
  "/",
  validateRequest(CreateEventRequestSchema),
  eventController.createEvent
);
