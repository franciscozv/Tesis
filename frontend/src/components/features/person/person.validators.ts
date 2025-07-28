import { z } from "zod";

export const personSchema = z.object({
	firstname: z
		.string()
		.min(3, "El nombre debe tener al menos 3 caracteres")
		.max(50, "El nombre debe tener como máximo 50 caracteres")
		.regex(/^[a-zA-Z\s]+$/, "El nombre solo puede contener letras"),
	lastname: z
		.string()
		.min(3, "El apellido debe tener al menos 3 caracteres")
		.max(50, "El apellido debe tener como máximo 50 caracteres")
		.regex(/^[a-zA-Z\s]+$/, "El apellido solo puede contener letras"),
	address: z.string().min(1, "La dirección es requerida"),
	phone: z
		.string()
		.min(9, "El teléfono debe tener 9 dígitos")
		.max(9, "El teléfono debe tener 9 dígitos")
		.regex(/^[0-9]+$/, "El teléfono solo puede contener números"),
	baptismDate: z
		.string({ required_error: "La fecha de bautismo es requerida" })
		.pipe(
			z.coerce
				.date()
				.max(new Date(), {
					message: "La fecha de bautismo debe ser en el pasado",
				}),
		),
	convertionDate: z
		.string({ required_error: "La fecha de conversión es requerida" })
		.pipe(
			z.coerce
				.date()
				.max(new Date(), {
					message: "La fecha de conversión debe ser en el pasado",
				}),
		),
	birthdate: z
		.string({ required_error: "La fecha de nacimiento es requerida" })
		.pipe(
			z.coerce
				.date()
				.max(new Date(), {
					message: "La fecha de nacimiento debe ser en el pasado",
				}),
		),
	gender: z.string(),
});
console.log("Person schema loaded");
export type PersonSchema = z.infer<typeof personSchema>;
