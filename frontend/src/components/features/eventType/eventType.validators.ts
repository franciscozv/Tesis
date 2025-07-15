import { z } from "zod";

export const eventTypeSchema = z.object({
  name: z.string().min(1, "El nombre del tipo de evento es requerido"),
  description: z.string().min(1, "La descripción del tipo de evento es requerida"),
});