import { z } from "zod";

export const eventTypeSchema = z.object({
  name: z.string()
    .min(1, "El nombre del tipo de evento es requerido")
    .regex(/^[a-zA-Z\s]+$/, "El nombre solo puede contener letras"),
  description: z.string()
    .min(1, "La descripción del tipo de evento es requerida")
    .regex(/^[a-zA-Z\s,]+$/, "La descripción solo puede contener letras, espacios y comas"),
  color: z.string()
    .min(1, "El color del tipo de evento es requerido")
    .regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser un código hexadecimal válido"),
});