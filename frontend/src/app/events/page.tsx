"use client";
import { useState, useEffect } from "react";
import {
  deleteEvent,
  getEvents,
  updateEventStatus,
} from "~/services/eventService";
import CreateEventForm from "~/components/features/event/CreateEventForm";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Button,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";

type Event = {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  state: string;
};

const Page = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: number; title: string } | null>(null);

  const fetchData = async () => {
    try {
      const data = await getEvents();
      setEvents(data || []);
    } catch (error) {
      console.error("Error al obtener eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id: number, title: string) => {
    setEventToDelete({ id, title });
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (eventToDelete) {
      try {
        await deleteEvent(eventToDelete.id);
        fetchData();
      } catch (error) {
        console.error("Error al eliminar evento:", error);
      } finally {
        setOpenConfirmDialog(false);
        setEventToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
    setEventToDelete(null);
  };

  const handleEdit = (event: Event) => {
    setEventToEdit(event);
  };

  const handleCancelEdit = () => {
    setEventToEdit(null);
  };

  const handleApprove = async (id: number) => {
    try {
      await updateEventStatus(id, "APPROVED");
      fetchData();
    } catch (error) {
      console.error("Error al aprobar evento:", error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await updateEventStatus(id, "REJECTED");
      fetchData();
    } catch (error) {
      console.error("Error al rechazar evento:", error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Eventos
      </Typography>

      <CreateEventForm
        onEventCreated={fetchData}
        eventToEdit={eventToEdit}
        onCancelEdit={handleCancelEdit}
      />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando eventos...
          </Typography>
        </Box>
      ) : events.length === 0 ? (
        <Typography variant="body1" sx={{ my: 4 }}>
          No se encontraron eventos.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Fecha Inicio (dd/mm/aaaa)</TableCell>
                <TableCell>Hora Inicio (HH:MM)</TableCell>
                <TableCell>Fecha Fin (dd/mm/aaaa)</TableCell>
                <TableCell>Hora Fin (HH:MM)</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow
                  key={event.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{event.description}</TableCell>
                  <TableCell>{formatDate(event.startDateTime)}</TableCell>
                  <TableCell>{formatTime(event.startDateTime)}</TableCell>
                  <TableCell>{formatDate(event.endDateTime)}</TableCell>
                  <TableCell>{formatTime(event.endDateTime)}</TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>{event.state}</TableCell>
                  <TableCell>
                    {event.state === "PENDING" && (
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <Button
                          variant="outlined"
                          color="success"
                          onClick={() => handleApprove(event.id)}
                          size="small"
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleReject(event.id)}
                          size="small"
                        >
                          Rechazar
                        </Button>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleEdit(event)}
                        size="small"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(event.id, event.title)}
                        size="small"
                      >
                        Eliminar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {eventToDelete && (
        <ConfirmationDialog
          open={openConfirmDialog}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar el evento "${eventToDelete.title}"? Esta acción no se puede deshacer.`}
        />
      )}
    </Box>
  );
};

export default Page;
