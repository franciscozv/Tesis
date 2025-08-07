import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Place = z.infer<typeof PlaceSchema>;
export const PlaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  address: z.string(),
  phones: z.string(),
  email: z.string(),
  photoUrl: z.string(),
  rooms: z.string(),
  createdAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime()),
});

// Input Validation for 'POST places' endpoint
export const CreatePlaceSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    address: z.string(),
    phones: z.string(),
    email: z.string().email(),
    photoUrl: z.string().url(),
    rooms: z.string(),
  }),
});

export const UpdatePlaceSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    address: z.string(),
    phones: z.string(),
    email: z.string().email(),
    photoUrl: z.string().url(),
    rooms: z.string(),
  }),
});

// Input Validation for 'GET places/:id' endpoint
export const GetPlaceSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
