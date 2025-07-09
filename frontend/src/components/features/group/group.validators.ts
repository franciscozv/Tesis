import { z } from "zod";

export const groupSchema = z.object({
  name: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre debe tener como máximo 50 caracteres")
    .regex(/^[a-zA-ZñÑ\s]+$/, "El nombre solo puede contener letras y espacios"),
    
  description: z
    .string()
    .min(3, "La descripción debe tener al menos 3 caracteres")
    .max(50, "La descripción debe tener como máximo 50 caracteres")
    .regex(/^[a-zA-ZñÑ\s.,;]+$/, "La descripción solo puede contener letras, espacios, punto, coma y punto y coma"),
});

export type GroupSchema = z.infer<typeof groupSchema>;
