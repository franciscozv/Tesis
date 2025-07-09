import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const PostEventSchema = z.object({
  id: z.number(),
  photoUrl: z.string(),
  comment: z.string(),
  conclution: z.string(),
  eventId: z.number(),
});

export const CreatePostEventSchema = z.object({
  comment: z.string(),
  conclution: z.string(),
  eventId: z.number(),
});

export const CreatePostEventRequestSchema = z.object({
  body: CreatePostEventSchema,
});
