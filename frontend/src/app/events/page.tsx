'use client';
import { useState, useEffect, useMemo } from "react";
import { getEvents, deleteEvent, updateEvent, updateEventStatus } from "~/services/eventService";
import CreateEventForm from "~/components/features/event/CreateEventForm";
import {
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";
import { DataTable } from "~/components/ui/DataTable";
import { getColumns, type Event } from "./columns";
import { UpdateEventFormSchema } from "~/components/features/event/event.validators";

const Page = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: number; title: string } | null>(null);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [statusAction, setStatusAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [statusEventId, setStatusEventId] = useState<number | null>(null);
  const [statusComment, setStatusComment] = useState("");

  const fetchData = async () => {
    setLoading(true);
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
        fetchData(); // Refrescar datos
      } catch (error) {
        console.error("Error al eliminar el evento:", error);
        alert("Error al eliminar el evento");
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

  const handleEventUpdate = (rowIndex: number, columnId: string, value: any) => {
    setEvents((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...old[rowIndex],
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  const handleSave = async (eventId: number) => {
    const eventToUpdate = events.find(e => e.id === eventId);
    if (eventToUpdate) {
      const validationResult = UpdateEventFormSchema.safeParse(eventToUpdate);
      if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        for (const [key, value] of Object.entries(validationResult.error.flatten().fieldErrors)) {
            if (value) newErrors[key] = value.join(', ');
        }
        setValidationErrors(newErrors);
        return; // Detener si hay errores
      }

      setValidationErrors({}); // Limpiar errores si la validación es exitosa
      try {
        await updateEvent(eventId, validationResult.data);
        setEditingRowId(null); // Salir del modo edición
      } catch (error) {
        console.error("Error al actualizar el evento:", error);
        alert("Error al actualizar el evento");
        fetchData(); // Revertir cambios si falla la API
      }
    }
  };

  const handleCancel = () => {
    setEditingRowId(null);
    setValidationErrors({}); // Limpiar errores al cancelar
    fetchData(); // Recargar datos originales
  };

  const handleOpenStatusDialog = (id: number, action: "APPROVED" | "REJECTED") => {
    setStatusEventId(id);
    setStatusAction(action);
    setStatusComment("");
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setStatusEventId(null);
    setStatusAction(null);
    setStatusComment("");
  };

  const handleConfirmStatus = async () => {
    if (statusEventId && statusAction) {
      try {
        await updateEventStatus(statusEventId, statusAction, statusComment);
        fetchData();
      } catch (error) {
        console.error("Error al actualizar estado del evento:", error);
      } finally {
        handleCloseStatusDialog();
      }
    }
  };

  const columns = useMemo(() => getColumns(handleDelete), []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Eventos
      </Typography>

      <Box sx={{ my: 4 }}>
        <CreateEventForm onEventCreated={fetchData} />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando eventos...
          </Typography>
        </Box>
      ) : (
        <DataTable 
          columns={columns} 
          data={events} 
          meta={{
            editingRowId,
            setEditingRowId,
            updateData: handleEventUpdate,
            saveRow: handleSave,
            cancelEdit: handleCancel,
            validationErrors,
          }}
        />
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

      <Dialog open={openStatusDialog} onClose={handleCloseStatusDialog}>
        <DialogTitle>
          {statusAction === "APPROVED" ? "Aprobar Evento" : "Rechazar Evento"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Comentario"
            type="text"
            fullWidth
            multiline
            minRows={2}
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            placeholder={statusAction === "APPROVED" ? "¿Por qué apruebas este evento?" : "¿Por qué rechazas este evento?"}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmStatus} color={statusAction === "APPROVED" ? "success" : "error"}>
            {statusAction === "APPROVED" ? "Aprobar" : "Rechazar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Page;