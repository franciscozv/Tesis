'use client';
import { useState, useEffect, useMemo } from "react";
import CreateResponsibility from '~/components/features/responsibility/CreateResponsibility';
import { getResponsibilities, deleteResponsibility, updateResponsibility } from '~/services/responsibilityService';
import {
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";
import { DataTable } from "~/components/ui/DataTable";
import { getColumns, type Responsibility } from "./columns";
import { responsibilitySchema } from "~/components/features/responsibility/responsibility.validators";

const Page = () => {
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [responsibilityToDelete, setResponsibilityToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getResponsibilities();
      setResponsibilities(data || []);
    } catch (error) {
      console.error("Error al obtener responsabilidades:", error);
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
        fetchData(); // Refrescar datos
      } catch (error) {
        console.error("Error al eliminar la responsabilidad:", error);
        alert("Error al eliminar la responsabilidad");
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

  const handleResponsibilityUpdate = (rowIndex: number, columnId: string, value: any) => {
    setResponsibilities((old) =>
      old.map((row, index) => {
        if (index === rowIndex) {
          return {
            ...row,
            [columnId]: value,
          };
        }
        return row;
      })
    );
  };

  const handleSave = async (responsibilityId: number) => {
    const responsibilityToUpdate = responsibilities.find(r => r.id === responsibilityId);
    if (responsibilityToUpdate) {
      const validationResult = responsibilitySchema.safeParse(responsibilityToUpdate);
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
        await updateResponsibility(responsibilityId, validationResult.data);
        setEditingRowId(null); // Salir del modo edición
      } catch (error) {
        console.error("Error al actualizar la responsabilidad:", error);
        alert("Error al actualizar la responsabilidad");
        fetchData(); // Revertir cambios si falla la API
      }
    }
  };

  const handleCancel = () => {
    setEditingRowId(null);
    setValidationErrors({}); // Limpiar errores al cancelar
    fetchData(); // Recargar datos originales
  };

  const columns = useMemo(() => getColumns(handleDelete), []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Responsabilidades
      </Typography>

      <Box sx={{ my: 4 }}>
        <CreateResponsibility onResponsibilityCreated={fetchData} />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando responsabilidades...
          </Typography>
        </Box>
      ) : (
        <DataTable 
          columns={columns} 
          data={responsibilities} 
          meta={{
            editingRowId,
            setEditingRowId,
            updateData: handleResponsibilityUpdate,
            saveRow: handleSave,
            cancelEdit: handleCancel,
            validationErrors,
          }}
        />
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