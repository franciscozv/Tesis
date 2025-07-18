import { z } from "zod";

export const eventTypeSchema = z.object({
  name: z.string()
    .min(1, "El nombre del tipo de evento es requerido")
    .regex(/^[a-zA-Z\s]+$/, "El nombre solo puede contener letras"),
  description: z.string()
    .min(1, "La descripción del tipo de evento es requerida")
    .regex(/^[a-zA-Z\s,]+$/, "La descripción solo puede contener letras, espacios y comas"),
});