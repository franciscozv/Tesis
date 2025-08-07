import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { GetPlaceSchema, PlaceSchema, UpdatePlaceSchema, CreatePlaceSchema } from "@/api/place/placeModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { placeController } from "./placeController";

export const placeRegistry = new OpenAPIRegistry();
export const placeRouter: Router = express.Router();

placeRegistry.register("Place", PlaceSchema);

placeRegistry.registerPath({
  method: "get",
  path: "/places",
  tags: ["Place"],
  responses: createApiResponse(z.array(PlaceSchema), "Success"),
});

placeRouter.get("/", placeController.getPlaces);

placeRegistry.registerPath({
  method: "get",
  path: "/places/{id}",
  tags: ["Place"],
  request: { params: GetPlaceSchema.shape.params },
  responses: createApiResponse(PlaceSchema, "Success"),
});

placeRouter.get("/:id", validateRequest(GetPlaceSchema), placeController.getPlace);

// OpenAPI registry
placeRegistry.registerPath({
  method: "post",
  path: "/places",
  tags: ["Place"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePlaceSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PlaceSchema, "Created"),
});

// Express route
placeRouter.post("/", validateRequest(CreatePlaceSchema), placeController.createPlace);

placeRegistry.registerPath({
  method: "delete",
  path: "/places/{id}",
  tags: ["Place"],
  request: { params: GetPlaceSchema.shape.params },
  responses: {
    204: {
      description: "Place deleted successfully",
    },
    404: {
      description: "Place not found",
    },
  },
});

placeRouter.delete("/:id", validateRequest(GetPlaceSchema), placeController.deletePlace);

placeRegistry.registerPath({
  method: "put",
  path: "/places/{id}",
  tags: ["Place"],
  request: {
    params: GetPlaceSchema.shape.params,
    body: {
      content: {
        "application/json": {
          schema: UpdatePlaceSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PlaceSchema, "Updated"),
});

placeRouter.put("/:id", validateRequest(UpdatePlaceSchema), placeController.updatePlace);
