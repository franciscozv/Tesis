import React, { useState, useEffect } from 'react';
import { updateGroup } from '~/services/groupService';
import { groupSchema } from './group.validators';
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  FormHelperText,
} from "@mui/material";

type Props = {
  group: {
    id: number;
    name: string;
    description?: string;
  };
  onUpdate: () => void; // Función que recarga los datos en el padre
  onCancel: () => void; // Función para cancelar la edición
};

const EditGroupForm: React.FC<Props> = ({ group, onUpdate, onCancel }) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  useEffect(() => {
    setName(group.name);
    setDescription(group.description || '');
    setErrors({}); // Clear errors when group changes
  }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = groupSchema.safeParse({ name, description });

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await updateGroup(group.id, result.data);
      onUpdate(); // Notificar que se actualizó exitosamente
    } catch (error) {
        if (error instanceof Error) {
            alert(`Error al actualizar grupo: ${error.message}`);
        } else {
            alert('An unknown error occurred.');
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
        Editar Grupo
      </Typography>

      <TextField
        label="Nombre del grupo"
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

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ flexGrow: 1 }}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
        <Button
          type="button"
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          disabled={loading}
          sx={{ flexGrow: 1 }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default EditGroupForm;
