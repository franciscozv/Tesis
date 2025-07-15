import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export const StateEnum = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export const EventSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string(),
	startDateTime: z.coerce.date(),
	endDateTime: z.coerce.date(),
	location: z.string(),
	state: StateEnum,
	reviewComment: z.string().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type Event = z.infer<typeof EventSchema>;

const startOfToday = new Date();
startOfToday.setHours(0, 0, 0, 0);

export const CreateEventSchema = z
	.object({
		title: z
			.string()
			.min(3, "Title must be at least 3 characters long")
			.max(100, "Title must be at most 100 characters long")
			.regex(/^[a-zA-Z\s]+$/, "Title can only contain letters and spaces"),
		description: z
			.string()
			.min(10, "Description must be at least 10 characters long")
			.max(500, "Description must be at most 500 characters long")
			.regex(/^[a-zA-Z\s]+$/, "Description can only contain letters and spaces"),
		startDateTime: z.coerce.date().refine((date) => date >= startOfToday, { message: "La fecha de inicio no puede ser en el pasado" }),
		endDateTime: z.coerce.date(),
		location: z
			.string()
			.min(3, "Location must be at least 3 characters long")
			.max(100, "Location must be at most 100 characters long"),
	})
	.refine((data) => data.endDateTime > data.startDateTime, {
		message: "La fecha de fin debe ser posterior a la de inicio",
		path: ["endDateTime"],
	});

export const CreateEventRequestSchema = z.object({
	body: CreateEventSchema,
});

export const UpdateEventSchema = z
	.object({
		title: z
			.string()
			.min(3, "Title must be at least 3 characters long")
			.max(100, "Title must be at most 100 characters long")
			.regex(/^[a-zA-Z\s]+$/, "Title can only contain letters and spaces")
			.optional(),
		description: z
			.string()
			.min(10, "Description must be at least 10 characters long")
			.max(500, "Description must be at most 500 characters long")
			.regex(/^[a-zA-Z\s]+$/, "Description can only contain letters and spaces")
			.optional(),
		startDateTime: z.coerce
			.date()
			.optional()
			.refine(
				(date) => {
					if (date) {
						return date >= startOfToday;
					}
					return true; // No validation if startDateTime is missing
				},
				{ message: "La fecha de inicio no puede ser en el pasado" },
			),
		endDateTime: z.coerce.date().optional(),
		location: z
			.string()
			.min(3, "Location must be at least 3 characters long")
			.max(100, "Location must be at most 100 characters long")
			.optional(),
		state: StateEnum.optional(),
	})
	.refine(
		(data) => {
			if (data.startDateTime && data.endDateTime) {
				return data.endDateTime > data.startDateTime;
			}
			return true; // No validation if one or both dates are missing
		},
		{
			message: "La fecha de fin debe ser posterior a la de inicio si ambas son proporcionadas",
			path: ["endDateTime"],
		},
	);
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const GetEventShema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const UpdateEventStatusSchema = z.object({
	state: StateEnum,
	reviewComment: z.string().max(500, "El comentario debe tener máximo 500 caracteres").optional(),
});

export const UpdateEventStatusRequestSchema = z.object({
	body: UpdateEventStatusSchema,
	params: z.object({ id: commonValidations.id }),
});
