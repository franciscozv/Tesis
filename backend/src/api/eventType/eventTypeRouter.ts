import { OpenAPIRegistry
 } from "@asteasolutions/zod-to-openapi";
 import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { GetEventTypeSchema, EventTypeSchema, UpdateEventTypeSchema, CreateEventTypeSchema } from "@/api/eventType/eventTypeModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { eventTypeController } from "./eventTypeController";

export const eventTypeRegistry = new OpenAPIRegistry();
export const eventTypeRouter: Router = express.Router();

eventTypeRegistry.register("EventType", EventTypeSchema);

eventTypeRegistry.registerPath({
  method: "get",
  path: "/event-type",
  tags: ["Event Type"],
  responses: createApiResponse(z.array(EventTypeSchema), "Success"),
});
eventTypeRouter.get("/", eventTypeController.getEventTypes);

eventTypeRegistry.registerPath({
  method: "get",
  path: "/event-type/{id}",
  tags: ["Event Type"],
  request: { params: GetEventTypeSchema.shape.params },
  responses: createApiResponse(EventTypeSchema, "Success"),
});

eventTypeRouter.get("/:id", validateRequest(GetEventTypeSchema), eventTypeController.getEventType);

eventTypeRegistry.registerPath({
  method: "post",
  path: "/event-type",
  tags: ["Event Type"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateEventTypeSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(EventTypeSchema, "Created"),
});

eventTypeRouter.post("/", validateRequest(CreateEventTypeSchema), eventTypeController.createEventType);

eventTypeRegistry.registerPath({
  method: "delete",
  path: "/event-type/{id}",
  tags: ["Event Type"],
  request: { params: GetEventTypeSchema.shape.params },
  responses: {
    204: {
      description: "Event Type deleted successfully",
    },
    404: {
      description: "Not Found",
    },
  },
});
eventTypeRouter.delete("/:id", validateRequest(GetEventTypeSchema), eventTypeController.deleteEventType);

eventTypeRegistry.registerPath({
  method: "put",
  path: "/event-type/{id}",
  tags: ["Event Type"],
  request: {
    params: GetEventTypeSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateEventTypeSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(EventTypeSchema, "Updated"),
});

eventTypeRouter.put(
  "/:id",
  validateRequest(UpdateEventTypeSchema),
  eventTypeController.updateEventType,
);