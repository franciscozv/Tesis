import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import {
  ResponsibilitySchema,
  CreateResponsibilitySchema,
  GetResponsibilitySchema,
  UpdateResponsibilitySchema,
} from "@/api/responsibility/responsibilityModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { responsibilityController } from "./responsibilityController";

export const responsibilityRegistry = new OpenAPIRegistry();
export const responsibilityRouter: Router = express.Router();

responsibilityRegistry.register("Responsibility", ResponsibilitySchema);

responsibilityRegistry.registerPath({
  method: "get",
  path: "/responsibilities",
  tags: ["Responsibility"],
  responses: createApiResponse(z.array(ResponsibilitySchema), "Success"),
});

responsibilityRouter.get("/", responsibilityController.getResponsibilities);

responsibilityRegistry.registerPath({
  method: "post",
  path: "/responsibilities",
  tags: ["Responsibility"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateResponsibilitySchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ResponsibilitySchema, "Created"),
});

responsibilityRouter.post(
  "/",
  validateRequest(CreateResponsibilitySchema),
  responsibilityController.CreateResponsibility
);

responsibilityRegistry.registerPath({
  method: "delete",
  path: "/responsibilities/{id}",
  tags: ["Responsibility"],
  request: { params: GetResponsibilitySchema.shape.params },
  responses: createApiResponse(ResponsibilitySchema, "Deleted"),
});

responsibilityRouter.delete(
  "/:id",
  validateRequest(GetResponsibilitySchema),
  responsibilityController.deleteResponsibility
);

responsibilityRegistry.registerPath({
  method: "put",
  path: "/responsibilities/{id}",
  tags: ["Responsibility"],
  request: {
    params: GetResponsibilitySchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdateResponsibilitySchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(ResponsibilitySchema, "Updated"),
});

responsibilityRouter.put(
  "/:id",
  validateRequest(UpdateResponsibilitySchema),
  responsibilityController.updateResponsibility
);
