"use client";
import { useState, useEffect } from 'react';
import CreateResponsibility from '~/components/features/responsibility/CreateResponsibility';
import EditResponsibilityForm from '~/components/features/responsibility/EditResponsibilityForm';
import { getResponsibilities, deleteResponsibility } from '~/services/responsibilityService';
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

// Tipo de dato
type Responsibility = {
  id: number;
  name: string;
  description: string;
};

const Page = () => {
  const [responsibility, setResponsibility] = useState<Responsibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [editResponsibility, setEditResponsibility] = useState<Responsibility | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [responsibilityToDelete, setResponsibilityToDelete] = useState<{ id: number; name: string } | null>(null);

  const fetchData = async () => {
    try {
      const data = await getResponsibilities();
      setResponsibility(data || []);
    } catch (error) {
      console.error('Error al obtener responsabilidades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id: number, name: string) => {
    setResponsibilityToDelete({ id, name });
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (responsibilityToDelete) {
      try {
        await deleteResponsibility(responsibilityToDelete.id);
        fetchData();
      } catch (error) {
        console.error('Error al eliminar la responsabilidad:', error);
        alert('Error al eliminar la responsabilidad');
      } finally {
        setOpenConfirmDialog(false);
        setResponsibilityToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
    setResponsibilityToDelete(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Responsabilidades
      </Typography>

      {editResponsibility ? (
        <EditResponsibilityForm
          responsibility={editResponsibility}
          onUpdate={() => {
            fetchData();
            setEditResponsibility(null);
          }}
          onCancel={() => setEditResponsibility(null)}
        />
      ) : (
        <Box sx={{ my: 4 }}>
          <CreateResponsibility onResponsibilityCreated={fetchData} />
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando responsabilidades...
          </Typography>
        </Box>
      ) : responsibility.length === 0 ? (
        <Typography variant="body1" sx={{ my: 4 }}>
          No se encontraron responsabilidades.
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
              {responsibility.map((resp) => (
                <TableRow
                  key={resp.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {resp.name}
                  </TableCell>
                  <TableCell>{resp.description}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setEditResponsibility(resp)}
                      sx={{ mr: 1 }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(resp.id, resp.name)}
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

      {responsibilityToDelete && (
        <ConfirmationDialog
          open={openConfirmDialog}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar la responsabilidad "${responsibilityToDelete.name}"? Esta acción no se puede deshacer.`}
        />
      )}
    </Box>
  );
};

export default Page;

