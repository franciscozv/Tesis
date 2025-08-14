import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { participantController } from "./participantController";
import {
  CreateParticipantSchema,
  ParticipantSchema,
  CreateParticipantRequestSchema,
  UpdateParticipantSchema,
} from "./participantModel";

export const participantRegistry = new OpenAPIRegistry();
export const participantRouter: Router = express.Router();

participantRegistry.register("Participant", ParticipantSchema);

participantRegistry.registerPath({
  method: "get",
  path: "/participants",
  tags: ["Participant"],
  responses: createApiResponse(z.array(ParticipantSchema), "Success"),
});

participantRouter.get("/", participantController.getParticipants);

participantRegistry.registerPath({
  method: "get",
  path: "/participants/{id}",
  tags: ["Participant"],
  request: {
    params: z.object({
      id: z.number(),
    }),
  },
  responses: createApiResponse(ParticipantSchema, "Success"),
});

participantRouter.get("/:id", participantController.getParticipantById);

participantRegistry.registerPath({
  method: "post",
  path: "/participants",
  tags: ["Participant"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateParticipantSchema,
        },
      },
    },
  },
  responses: createApiResponse(ParticipantSchema, "Created"),
});

participantRouter.post("/", validateRequest(CreateParticipantRequestSchema), participantController.createParticipant);

participantRegistry.registerPath({
  method: "put",
  path: "/participants/{id}",
  tags: ["Participant"],
  request: {
    params: z.object({
      id: z.number(),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateParticipantSchema,
        },
      },
    },
  },
  responses: createApiResponse(ParticipantSchema, "Updated"),
});

participantRouter.put("/:id", validateRequest(z.object({ body: UpdateParticipantSchema })), participantController.updateParticipant);

participantRegistry.registerPath({
  method: "delete",
  path: "/participants/{id}",
  tags: ["Participant"],
  request: {
    params: z.object({
      id: z.number(),
    }),
  },
  responses: createApiResponse(ParticipantSchema, "Deleted"),
});

participantRouter.delete("/:id", participantController.deleteParticipant);
