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
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type Event = z.infer<typeof EventSchema>;

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
		startDateTime: z.coerce.date().refine((date) => date > new Date(), { message: "Start date must be in the future" }),
		endDateTime: z.coerce.date(),
		location: z
			.string()
			.min(3, "Location must be at least 3 characters long")
			.max(100, "Location must be at most 100 characters long"),
	})
	.refine((data) => {
    if (data.startDateTime && data.endDateTime) {
      return data.endDateTime > data.startDateTime;
    }
    return true;
  }, {
    message: "End date must be after start date",
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
						return date > new Date();
					}
					return true; // No validation if startDateTime is missing
				},
				{ message: "Start date must be in the future" },
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
			message: "End date must be after start date if both are provided",
			path: ["endDateTime"],
		},
	);
export type UpdateEventInput = z.infer<typeof UpdateEventSchema>;

export const GetEventShema = z.object({
	params: z.object({ id: commonValidations.id }),
});

export const UpdateEventStatusSchema = z.object({
	state: StateEnum,
});

export const UpdateEventStatusRequestSchema = z.object({
	body: UpdateEventStatusSchema,
	params: z.object({ id: commonValidations.id }),
});
