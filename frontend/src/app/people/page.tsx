"use client";
import { useState, useEffect } from "react";
import CreatePerson from "~/components/features/person/CreatePerson";
import EditPersonForm from "~/components/features/person/EditPersonForm";
import { getPeople, deletePerson } from "~/services/personService";
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Container,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Dialog,
  Fab,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";

type Person = {
  id: number;
  firstname: string;
  lastname: string;
  address: string;
  phone: string;
  baptismDate: string;
  convertionDate: string;
  birthdate: string;
  gender: string;
};

const Page = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0"); // Meses son 0-indexados
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Gestión de Personas
      </Typography>

      <Card>
        <CardHeader title="Miembros" />
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Cargando personas...
              </Typography>
            </Box>
          ) : people.length === 0 ? (
            <Typography variant="body1" sx={{ my: 4, textAlign: "center" }}>
              No se encontraron personas. ¡Añade una!
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Apellido</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>F. Nacimiento</TableCell>
                    <TableCell>F. Conversión</TableCell>
                    <TableCell>F. Bautismo</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {people.map((person) => (
                    <TableRow
                      key={person.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell>{person.firstname}</TableCell>
                      <TableCell>{person.lastname}</TableCell>
                      <TableCell>{person.phone}</TableCell>
                      <TableCell>{formatDate(person.birthdate)}</TableCell>
                      <TableCell>{formatDate(person.convertionDate)}</TableCell>
                      <TableCell>{formatDate(person.baptismDate)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => setEditPerson(person)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            color="error"
                            onClick={() =>
                              handleDelete(
                                person.id,
                                `${person.firstname} ${person.lastname}`
                              )
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: "fixed", bottom: 32, right: 32 }}
        onClick={() => setOpenCreateDialog(true)}
      >
        <AddIcon />
      </Fab>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <CreatePerson
          onPersonCreated={() => {
            fetchData();
            setOpenCreateDialog(false);
          }}
          onCancel={() => setOpenCreateDialog(false)}
        />
      </Dialog>

      {editPerson && (
        <Dialog open={!!editPerson} onClose={() => setEditPerson(null)} maxWidth="sm" fullWidth>
          <EditPersonForm
            person={editPerson}
            onUpdate={() => {
              fetchData();
              setEditPerson(null);
            }}
            onCancel={() => setEditPerson(null)}
          />
        </Dialog>
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
    </Container>
  );
};

export default Page;
