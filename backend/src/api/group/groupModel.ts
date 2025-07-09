import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type Group = z.infer<typeof GroupSchema>;
export const GroupSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string(),
	createdAt: z.date().or(z.string().datetime()),
	updatedAt: z.date().or(z.string().datetime()),
});

// Input Validation for 'POST groups' endpoint
export const CreateGroupSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Name is required"),
		description: z.string(),
	}),
});

export const UpdateGroupSchema = z.object({
	params: z.object({ id: commonValidations.id }),
	body: z.object({
		name: z.string().min(1, "Name is required"),
		description: z.string(),
	}),
});

// Input Validation for 'GET groups/:id' endpoint
export const GetGroupSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});
