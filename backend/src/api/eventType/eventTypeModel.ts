import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);


export type EventType = z.infer<typeof EventTypeSchema>;
export const EventTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  createdAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime()),
});

// Input Validation for 'POST eventTypes' endpoint
export const CreateEventTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    color: z.string().min(1, "Color is required").regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code"),
  }),
});

export const UpdateEventTypeSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    color: z.string().min(1, "Color is required").regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex code"),
  }),
});

// Input Validation for 'GET eventTypes/:id' endpoint
export const GetEventTypeSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});