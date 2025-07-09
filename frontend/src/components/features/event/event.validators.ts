import { z } from "zod";

export const CreateEventFormSchema = z
  .object({
    title: z
      .string()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(100, "El título debe tener como máximo 100 caracteres")
      .regex(
        /^[a-zA-Z\s]+$/,
        "El título solo puede contener letras y espacios"
      ),
    description: z
      .string()
      .min(10, "La descripción debe tener al menos 10 caracteres")
      .max(500, "La descripción debe tener como máximo 500 caracteres")
      .regex(
        /^[a-zA-Z\s]+$/,
        "La descripción solo puede contener letras y espacios"
      ),
    startDateTime: z.coerce.date().refine((date) => date > new Date(), {
      message: "La fecha de inicio debe ser en el futuro",
    }),
    endDateTime: z.coerce.date(),
    location: z
      .string()
      .min(3, "La ubicación debe tener al menos 3 caracteres")
      .max(100, "La ubicación debe tener como máximo 100 caracteres"),
  })
  .refine((data) => data.endDateTime > data.startDateTime, {
    message: "La fecha de fin debe ser posterior a la fecha de inicio",
    path: ["endDateTime"],
  });

export const UpdateEventFormSchema = z
  .object({
    title: z
      .string()
      .min(3, "El título debe tener al menos 3 caracteres")
      .max(100, "El título debe tener como máximo 100 caracteres")
      .regex(/^[a-zA-Z\s]+$/, "El título solo puede contener letras y espacios")
      .optional(),
    description: z
      .string()
      .min(10, "La descripción debe tener al menos 10 caracteres")
      .max(500, "La descripción debe tener como máximo 500 caracteres")
      .regex(
        /^[a-zA-Z\s]+$/,
        "La descripción solo puede contener letras y espacios"
      )
      .optional(),
    startDateTime: z.coerce
      .date()
      .optional()
      .refine(
        (date) => {
          if (date) {
            return date > new Date();
          }
          return true;
        },
        { message: "La fecha de inicio debe ser en el futuro" }
      ),
    endDateTime: z.coerce.date().optional(),
    location: z
      .string()
      .min(3, "La ubicación debe tener al menos 3 caracteres")
      .max(100, "La ubicación debe tener como máximo 100 caracteres")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDateTime && data.endDateTime) {
        return data.endDateTime > data.startDateTime;
      }
      return true;
    },
    {
      message:
        "La fecha de fin debe ser posterior a la fecha de inicio si ambas son proporcionadas",
      path: ["endDateTime"],
    }
  );

export type CreateEventFormInput = z.infer<typeof CreateEventFormSchema>;
export type UpdateEventFormInput = z.infer<typeof UpdateEventFormSchema>;
