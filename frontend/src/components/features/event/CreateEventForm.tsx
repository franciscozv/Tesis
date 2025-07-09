import React, { useState, useEffect } from "react";
import { createEvent, updateEvent } from "~/services/eventService";
import { CreateEventFormSchema } from "./event.validators";
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
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
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 600,
        mx: "auto",
        p: 3,
        border: "1px solid #ccc",
        borderRadius: 2,
        boxShadow: 1,
        mb: 4,
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        {eventToEdit
          ? "Editar Solicitud de Evento"
          : "Crear Solicitud de Evento"}
      </Typography>

      <TextField
        label="Título"
        name="title"
        variant="outlined"
        fullWidth
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        error={!!errors.title}
        helperText={errors.title ? errors.title[0] : ""}
      />

      <TextField
        label="Descripción"
        name="description"
        variant="outlined"
        fullWidth
        multiline
        rows={4}
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        error={!!errors.description}
        helperText={errors.description ? errors.description[0] : ""}
      />

      <DatePicker
        label="Fecha de Inicio"
        value={dateStart}
        onChange={(newValue) => setDateStart(newValue)}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
            error: !!errors.startDateTime,
            helperText: errors.startDateTime ? errors.startDateTime[0] : "",
          },
        }}
      />

      <TimePicker
        label="Hora de Inicio"
        value={timeStart}
        onChange={(newValue) => setTimeStart(newValue)}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
          },
        }}
      />

      <DatePicker
        label="Fecha de Fin"
        value={dateEnd}
        onChange={(newValue) => setDateEnd(newValue)}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
            error: !!errors.endDateTime,
            helperText: errors.endDateTime ? errors.endDateTime[0] : "",
          },
        }}
      />

      <TimePicker
        label="Hora de Fin"
        value={timeEnd}
        onChange={(newValue) => setTimeEnd(newValue)}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
          },
        }}
      />

      <TextField
        label="Ubicación"
        name="location"
        variant="outlined"
        fullWidth
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        error={!!errors.location}
        helperText={errors.location ? errors.location[0] : ""}
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
          {loading
            ? eventToEdit
              ? "Actualizando..."
              : "Creando..."
            : eventToEdit
            ? "Actualizar Evento"
            : "Crear Evento"}
        </Button>
        {eventToEdit && (
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={onCancelEdit}
            disabled={loading}
            sx={{ flexGrow: 1 }}
          >
            Cancelar
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CreateEventForm;
