import React, { useState } from "react";
import { createResponsibility } from "~/services/responsibilityService";
import { responsibilitySchema } from "./responsibility.validators";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
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
    <Card elevation={3} sx={{ borderRadius: 2, mb: 4, maxWidth: 600, margin: 'auto' }}>
      <CardHeader
        title="Crear Nueva Responsabilidad"
        titleTypographyProps={{ variant: 'h5', align: 'center' }}
      />
      <Divider />
      <CardContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 2 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Nombre de la responsabilidad"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name ? errors.name[0] : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción de la responsabilidad"
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description ? errors.description[0] : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? "Creando..." : "Crear Responsabilidad"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateResponsibility;