"use client";
import { useEffect, useState } from "react";
import CreateGroupForm from "../../components/features/group/CreateGroupForm";
import EditGroupForm from "../../components/features/group/EditGroupForm";
import { deleteGroup, getGroups } from "~/services/groupService";
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

const Page = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editGroup, setEditGroup] = useState(null); // Grupo a editar
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      const data = await getGroups();
      setGroups(data || []);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    setGroupToDelete({ id, name });
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (groupToDelete) {
      try {
        const data = await deleteGroup(groupToDelete.id);

        if (data) {
          fetchData();
        } else {
          alert(`Error al eliminar grupo: ${data.message}`);
        }
      } catch (error) {
        console.error("Error al eliminar:", error);
      } finally {
        setOpenConfirmDialog(false);
        setGroupToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDialog(false);
    setGroupToDelete(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Grupos
      </Typography>

      {editGroup ? (
        <EditGroupForm
          group={editGroup}
          onUpdate={() => {
            fetchData();
            setEditGroup(null);
          }}
          onCancel={() => setEditGroup(null)}
        />
      ) : (
        <Box sx={{ my: 4 }}>
          <CreateGroupForm onGroupCreated={fetchData} />
        </Box>
      )}

      {/* Lista de grupos */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Cargando grupos...
          </Typography>
        </Box>
      ) : groups.length === 0 ? (
        <Typography variant="body1" sx={{ my: 4 }}>
          No se encontraron grupos.
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
              {groups.map((group: any) => (
                <TableRow
                  key={group.id}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {group.name}
                  </TableCell>
                  <TableCell>{group.description}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setEditGroup(group)}
                      sx={{ mr: 1 }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleDelete(group.id, group.name)}
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

      {groupToDelete && (
        <ConfirmationDialog
          open={openConfirmDialog}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar el grupo "${groupToDelete.name}"? Esta acción no se puede deshacer.`}
        />
      )}
    </Box>
  );
};

export default Page;
