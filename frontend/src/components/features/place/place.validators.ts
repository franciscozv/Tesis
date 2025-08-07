import { z } from "zod";

export const placeSchema = z.object({
	name: z
		.string()
		.min(1, "El nombre del lugar es requerido"),
	description: z
		.string()
		.min(1, "La descripción del lugar es requerida"),
	address: z.string().min(1, "La dirección es requerida"),
	phones: z.string().min(1, "El teléfono es requerido"),
	email: z.string().email("El email no es válido"),
	photoUrl: z.string().url("La URL de la foto no es válida"),
	rooms: z.string().min(1, "Las salas son requeridas"),
});
