import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Responsibility = z.infer<typeof ResponsibilitySchema>;

export const ResponsibilitySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export const CreateResponsibilitySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
  }),
});

export type CreateResponsibilityInput = z.infer<
  typeof CreateResponsibilitySchema.shape.body
>;

export const UpdateResponsibilitySchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
  }),
});

// Input Validation for 'GET responsibilities/:id' endpoint
export const GetResponsibilitySchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
