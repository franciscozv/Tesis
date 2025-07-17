'use client';
import React, { useState, useEffect } from "react";

import { createEvent, updateEvent } from "~/services/eventService";
import { CreateEventFormSchema } from "./event.validators";
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from "@mui/material";
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';



type Event = {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  state: string;
};

type Props = {
  onEventCreated?: () => void;
  eventToEdit?: Event | null;
  onCancelEdit?: () => void;
};

const CreateEventForm: React.FC<Props> = ({
  onEventCreated,
  eventToEdit,
  onCancelEdit,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
  });

  const [dateStart, setDateStart] = useState<Dayjs | null>(null);
  const [timeStart, setTimeStart] = useState<Dayjs | null>(null);
  const [dateEnd, setDateEnd] = useState<Dayjs | null>(null);
  const [timeEnd, setTimeEnd] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  useEffect(() => {
    if (eventToEdit) {
      const currentEvent = eventToEdit;
      setFormData({
        title: currentEvent.title,
        description: currentEvent.description,
        location: currentEvent.location,
      });
      setDateStart(dayjs(currentEvent.startDateTime));
      setTimeStart(dayjs(currentEvent.startDateTime));
      setDateEnd(dayjs(currentEvent.endDateTime));
      setTimeEnd(dayjs(currentEvent.endDateTime));
    } else {
      setFormData({
        title: "",
        description: "",
        location: "",
      });
      setDateStart(null);
      setTimeStart(null);
      setDateEnd(null);
      setTimeEnd(null);
    }
    setErrors({});
  }, [eventToEdit]);

  useEffect(() => {
    if (dateStart && dateEnd && timeStart && timeEnd) {
      const start = dateStart.hour(timeStart.hour()).minute(timeStart.minute());
      const end = dateEnd.hour(timeEnd.hour()).minute(timeEnd.minute());
      if (end.isBefore(start)) {
        setErrors((prev) => ({ ...prev, endDateTime: ["La fecha y hora de fin no puede ser anterior a la de inicio"] }));
      } else {
        setErrors((prev) => ({ ...prev, endDateTime: undefined }));
      }
    }
  }, [dateStart, timeStart, dateEnd, timeEnd]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = dateStart && timeStart ? dayjs(dateStart).hour(timeStart.hour()).minute(timeStart.minute()).second(0).format() : '';
    const endDateTime = dateEnd && timeEnd ? dayjs(dateEnd).hour(timeEnd.hour()).minute(timeEnd.minute()).second(0).format() : '';

    const dataToSend = {
      ...formData,
      startDateTime,
      endDateTime,
    };

    const result = CreateEventFormSchema.safeParse(dataToSend);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      if (eventToEdit) {
        await updateEvent(eventToEdit.id, result.data);
      } else {
        await createEvent(result.data);
      }
      setFormData({
        title: "",
        description: "",
        location: "",
      });
      setDateStart(null);
      setTimeStart(null);
      setDateEnd(null);
      setTimeEnd(null);
      onEventCreated?.();
      onCancelEdit?.();
    } catch (err) {
      if (err instanceof Error) {
        alert(
          `Error al ${eventToEdit ? "actualizar" : "crear"} evento: ${
            err.message
          }`
        );
      } else {
        alert("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={3} sx={{ borderRadius: 2, maxWidth: 600, margin: 'auto' }}>
      <CardHeader
        title={eventToEdit ? "Editar Solicitud de Evento" : "Crear Solicitud de Evento"}
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
                label="Título"
                name="title"
                fullWidth
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={!!errors.title}
                helperText={errors.title ? errors.title[0] : ""}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Descripción"
                name="description"
                fullWidth
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!errors.description}
                helperText={errors.description ? errors.description[0] : ""}
              />
            </Grid>

            <Grid item xs={12} sm={6} component="div">
              <DatePicker
                label="Fecha de Inicio"
                value={dateStart}
                onChange={(newValue) => setDateStart(newValue)}
                minDate={dayjs()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.startDateTime,
                    helperText: errors.startDateTime ? errors.startDateTime[0] : "",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} component="div">
              <TimePicker
                label="Hora de Inicio"
                value={timeStart}
                onChange={(newValue) => setTimeStart(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} component="div">
              <DatePicker
                label="Fecha de Fin"
                value={dateEnd}
                onChange={(newValue) => setDateEnd(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.endDateTime,
                    helperText: errors.endDateTime ? errors.endDateTime[0] : "",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} component="div">
              <TimePicker
                label="Hora de Fin"
                value={timeEnd}
                onChange={(newValue) => setTimeEnd(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.endDateTime,
                    helperText: errors.endDateTime ? errors.endDateTime[0] : "",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} component="div">
              <TextField
                label="Ubicación"
                name="location"
                fullWidth
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                error={!!errors.location}
                helperText={errors.location ? errors.location[0] : ""}
              />
            </Grid>

            <Grid item xs={12} component="div">
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading
                    ? eventToEdit
                      ? "Actualizando..."
                      : "Creando Solicitud..."
                    : eventToEdit
                    ? "Actualizar Evento"
                    : "Crear Solicitud de Evento"}
                </Button>
                {eventToEdit && (
                  <Button
                    type="button"
                    variant="outlined"
                    color="secondary"
                    onClick={onCancelEdit}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateEventForm;