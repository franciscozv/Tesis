import React, { useState } from "react";
import { createEventType } from "~/services/eventTypeService";
import { eventTypeSchema } from "./eventType.validators";
import { TextField, Button, Typography, Box, CircularProgress, FormHelperText } from "@mui/material";

type Props = {
  onEventTypeCreated?: () => void;
};

const CreateEventTypeForm: React.FC<Props> = ({ onEventTypeCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = eventTypeSchema.safeParse({ name, description });

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await createEventType({
        ...result.data,
        description: result.data.description ?? "",
      });
      setName("");
      setDescription("");
      onEventTypeCreated?.(); // Notifica al padre si existe
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error al crear tipo de evento: ${error.message}`);
      } else {
        alert("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 400,
        mx: "auto",
        p: 3,
        border: "1px solid #ccc",
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Crear Nuevo Tipo de Evento
      </Typography>
      <TextField
        label="Nombre del tipo de evento"
        variant="outlined"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!!errors.name}
        helperText={errors.name ? errors.name[0] : ""}
      />
      <TextField
        label="Descripción"
        variant="outlined"
        fullWidth
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={!!errors.description}
        helperText={errors.description ? errors.description[0] : ""}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? "Creando..." : "Crear Tipo de Evento"}
      </Button>
    </Box>
  );
};

export default CreateEventTypeForm;