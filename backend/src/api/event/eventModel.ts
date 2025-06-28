import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const StateEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const EventSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
  timeStart: z.coerce.date(),
  timeEnd: z.coerce.date(),
  location: z.string(),
  state: StateEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Event = z.infer<typeof EventSchema>;

export const CreateEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
  timeStart: z.coerce.date(),
  timeEnd: z.coerce.date(),
  location: z.string(),
});

export const CreateEventRequestSchema = z.object({
  body: CreateEventSchema,
});

export const UpdateEventSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dateStart: z.coerce.date().optional(),
  dateEnd: z.coerce.date().optional(),
  timeStart: z.coerce.date().optional(),
  timeEnd: z.coerce.date().optional(),
  location: z.string().optional(),
  state: StateEnum.optional(),
});
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const GetEventShema = z.object({
  params: z.object({ id: commonValidations.id }),
});
