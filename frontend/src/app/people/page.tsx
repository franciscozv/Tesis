"use client";
import { useState, useEffect, useMemo } from "react";
import CreatePerson from "~/components/features/person/CreatePerson";
import EditPersonForm from "~/components/features/person/EditPersonForm";
import { getPeople, deletePerson } from "~/services/personService";
import {
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";
import { DataTable } from "~/components/ui/DataTable";
import { getColumns, type Person } from "./columns";

const Page = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      const data = await getPeople();
      setPeople(data || []);
    } catch (error) {
      console.error("Error al obtener personas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id: number, name: string) => {
    setPersonToDelete({ id, name });
    setOpenConfirmDialog(true);
  };

  const handleEdit = (person: Person) => {
    setEditPerson(person);
  };

  const handleConfirmDelete = async () => {
    if (personToDelete) {
      try {
        await deletePerson(personToDelete.id);
        fetchData();
      } catch (error) {
        console.error("Error al eliminar la persona:", error);
        alert("Error al eliminar la persona");
      } finally {
        setOpenConfirmDialog(false);
        setPersonToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
    setPersonToDelete(null);
  };

  const columns = useMemo(() => getColumns(handleEdit, handleDelete), []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Personas
      </Typography>

      {editPerson ? (
        <EditPersonForm
          person={editPerson}
          onUpdate={() => {
            fetchData();
            setEditPerson(null);
          }}
          onCancel={() => setEditPerson(null)}
        />
      ) : (
        <Box sx={{ my: 4 }}>
          <CreatePerson onPersonCreated={fetchData} />
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando personas...
          </Typography>
        </Box>
      ) : people.length === 0 ? (
        <Typography variant="body1" sx={{ my: 4, textAlign: "center" }}>
          No se encontraron personas.
        </Typography>
      ) : (
        <DataTable columns={columns} data={people} />
      )}

      {personToDelete && (
        <ConfirmationDialog
          open={openConfirmDialog}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar a "${personToDelete.name}"? Esta acción no se puede deshacer.`}
        />
      )}
    </Box>
  );
};

export default Page;
