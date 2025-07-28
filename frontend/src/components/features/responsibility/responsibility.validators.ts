import { z } from "zod";

export const responsibilitySchema = z.object({
	name: z
		.string()
		.min(3, "El nombre debe tener al menos 3 caracteres")
		.max(100, "El nomre debe tener como máximo 100 caracteres")
		.regex(/^[a-zA-Z\s]+$/, "El nombre solo puede contener letras y espacios"),
	description: z
		.string()
		.min(10, "La descripción debe tener al menos 10 caracteres")
		.max(500, "La descripción debe tener como máximo 500 caracteres")
		.regex(
			/^[a-zA-Z\s,]+$/,
			"La descripción solo puede contener letras, espacios y comas",
		),
});

export type ResponsibilitySchema = z.infer<typeof responsibilitySchema>;
