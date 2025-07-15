"use client";
import { useEffect, useState } from "react";
import CreateEventTypeForm from "../../components/features/eventType/CreateEventTypeForm";
import EditEventTypeForm from "../../components/features/eventType/EditEventTypeForm";
import { deleteEventType, getEventTypes } from "~/services/eventTypeService";
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

// Define the EventType type
type EventType = {
  id: number;
  name: string;
  description: string;
};

const Page = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editEventType, setEditEventType] = useState<EventType | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventTypeToDelete, setEventTypeToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      const data = await getEventTypes();
      setEventTypes(data || []);
    } catch (error) {
      console.error("Error al obtener tipos de evento:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    setEventTypeToDelete({ id, name });
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (eventTypeToDelete) {
      try {
        const data = await deleteEventType(eventTypeToDelete.id);

        if (data) {
          fetchData();
        } else {
          alert(`Error al eliminar tipo de evento: ${data.message}`);
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
      } finally {
        setOpenConfirmDialog(false);
        setEventTypeToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
    setEventTypeToDelete(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Tipos de Evento
      </Typography>

      {editEventType ? (
        <EditEventTypeForm
          eventType={editEventType}
          onUpdate={() => {
            fetchData();
            setEditEventType(null);
          }}
          onCancel={() => setEditEventType(null)}
        />
      ) : (
        <Box sx={{ my: 4 }}>
          <CreateEventTypeForm onEventTypeCreated={fetchData} />
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando tipos de evento...
          </Typography>
        </Box>
      ) : eventTypes.length === 0 ? (
        <Typography variant="body1" sx={{ my: 4 }}>
          No se encontraron tipos de evento.
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eventTypes.map((eventType: EventType) => (
                <TableRow
                  key={eventType.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {eventType.name}
                  </TableCell>
                  <TableCell>{eventType.description}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setEditEventType(eventType)}
                      sx={{ mr: 1 }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(eventType.id, eventType.name)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {eventTypeToDelete && (
        <ConfirmationDialog
          open={openConfirmDialog}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar el tipo de evento "${eventTypeToDelete.name}"? Esta acción no se puede deshacer.`}
        />
      )}
    </Box>
  );
};

export default Page;
