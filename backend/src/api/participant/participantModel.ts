import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const ParticipantSchema = z.object({
  id: z.number(),
  eventId: z.number().int(),
  personId: z.number().int(),
  responsibilityId: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

export const CreateParticipantSchema = z.object({
  eventId: z.number().int(),
  personId: z.number().int(),
  responsibilityId: z.number().int(),
});

export const CreateParticipantRequestSchema = z.object({
  body: CreateParticipantSchema,
});

export const UpdateParticipantSchema = z.object({
  eventId: z.number().int().optional(),
  personId: z.number().int().optional(),
  responsibilityId: z.number().int().optional(),
});

export type UpdateParticipantInput = z.infer<typeof UpdateParticipantSchema>;

export const GetParticipantSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});
