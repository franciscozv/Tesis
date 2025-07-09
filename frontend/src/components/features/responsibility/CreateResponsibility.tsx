import React, { useState } from "react";
import { createResponsibility } from "~/services/responsibilityService";
import { responsibilitySchema } from "./responsibility.validators";
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";

type Props = {
  onResponsibilityCreated?: () => void; // Para notificar al padre (opcional)
};

const CreateResponsibility: React.FC<Props> = ({ onResponsibilityCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = responsibilitySchema.safeParse({ name, description });

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await createResponsibility(result.data);
      setName("");
      setDescription("");
      onResponsibilityCreated?.(); // Notifica al padre si existe
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error al crear responsabilidad: ${error.message}`);
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
        mb: 4, // Add some margin bottom
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Crear Nueva Responsabilidad
      </Typography>
      <TextField
        label="Nombre de la responsabilidad"
        variant="outlined"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={!!errors.name}
        helperText={errors.name ? errors.name[0] : ""}
      />
      <TextField
        label="Descripción de la responsabilidad"
        variant="outlined"
        fullWidth
        multiline
        rows={3}
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
        {loading ? "Creando..." : "Crear Responsabilidad"}
      </Button>
    </Box>
  );
};

export default CreateResponsibility;
