import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type User = z.infer<typeof UserSchema>;
export const UserSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string().email(),
	password: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const CreateUserSchema = z.object({
	body: z.object({
		name: z.string().min(1, "Name is required"),
		email: z.string().email("Invalid email format"),
		password: z.string().min(6, "Password must be at least 6 characters long"),
	}),
});

export type createUserInput = z.infer<typeof CreateUserSchema.shape.body>;

// Input Validation for 'GET users/:id' endpoint
export const GetUserSchema = z.object({
	params: z.object({ id: commonValidations.id }),
});
