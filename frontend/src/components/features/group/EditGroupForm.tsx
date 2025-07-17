import React, { useState, useEffect } from 'react';
import { updateGroup } from '~/services/groupService';
import { groupSchema } from './group.validators';
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
    <Card elevation={3} sx={{ borderRadius: 2, mb: 4, maxWidth: 600, margin: 'auto' }}>
      <CardHeader
        title="Editar Grupo"
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
                label="Nombre del grupo"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name ? errors.name[0] : ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
                helperText={errors.description ? errors.description[0] : ""}
              />
            </Grid>
            <Grid xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EditGroupForm;