import ColorPicker from '~/components/ui/ColorPicker';
import React, { useState, useEffect } from 'react';
import { updateEventType } from '~/services/eventTypeService';
import { eventTypeSchema } from './eventType.validators';
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
import type { EventType } from '~/types/example';

type Props = {
  eventType: EventType;
  onUpdate: () => void; // Función que recarga los datos en el padre
  onCancel: () => void; // Función para cancelar la edición
};

const EditEventTypeForm: React.FC<Props> = ({ eventType, onUpdate, onCancel }) => {
  const [name, setName] = useState(eventType.name);
  const [description, setDescription] = useState(eventType.description || '');
  const [color, setColor] = useState(eventType.color || '#000000');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  useEffect(() => {
    setName(eventType.name);
    setDescription(eventType.description || '');
    setColor(eventType.color || '#000000');
    setErrors({}); // Clear errors when eventType changes
  }, [eventType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = eventTypeSchema.safeParse({ name, description, color });

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await updateEventType(eventType.id, { ...result.data, color });
      onUpdate(); // Notificar que se actualizó exitosamente
    } catch (error) {
        if (error instanceof Error) {
            alert(`Error al actualizar tipo de evento: ${error.message}`);
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
        title="Editar Tipo de Evento"
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
                label="Nombre del tipo de evento"
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
            <Grid item xs={12}>
              <ColorPicker
                selectedColor={color}
                onColorChange={setColor}
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

export default EditEventTypeForm;
