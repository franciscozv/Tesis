import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import {
  CreateUserSchema,
  GetUserSchema,
  UserSchema,
} from "@/api/user/userModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { userController } from "./userController";

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

userRegistry.register("User", UserSchema);

userRegistry.registerPath({
  method: "get",
  path: "/users",
  tags: ["User"],
  responses: createApiResponse(z.array(UserSchema), "Success"),
});

userRouter.get("/", userController.getUsers);

userRegistry.registerPath({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  request: { params: GetUserSchema.shape.params },
  responses: createApiResponse(UserSchema, "Success"),
});

userRouter.get("/:id", validateRequest(GetUserSchema), userController.getUser);

userRegistry.registerPath({
  method: "post",
  path: "/users",
  tags: ["User"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(UserSchema, "Created"),
});

userRouter.post(
  "/",
  validateRequest(CreateUserSchema),
  userController.createUser
);

userRegistry.registerPath({
  method: "delete",
  path: "/users/{id}",
  tags: ["User"],
  request: { params: GetUserSchema.shape.params },
  responses: createApiResponse(UserSchema, "Deleted"),
});

userRouter.delete(
  "/:id",
  validateRequest(GetUserSchema),
  userController.deleteUser
);
