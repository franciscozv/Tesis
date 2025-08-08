'use client';

import { useEffect, useState } from 'react';
import { getPeopleRoles, createPeopleRole, updatePeopleRole, deletePeopleRole } from '~/services/peopleRoleService';
import type { PeopleRole } from '~/types/peopleRole';
import { List, ListItem, ListItemText, Typography, Container, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, ListItemButton, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationDialog from '~/components/ui/ConfirmationDialog';

export default function PeopleRolesPage() {
  const [peopleRoles, setPeopleRoles] = useState<PeopleRole[]>([]);
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<Partial<PeopleRole>>({ name: '', description: '' });
  const [errors, setErrors] = useState({ name: false, description: false });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<{ id: number; name: string } | null>(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const fetchPeopleRoles = async () => {
    const roles = await getPeopleRoles();
    setPeopleRoles(roles.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    fetchPeopleRoles();
  }, []);

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const validate = () => {
    const newErrors = { name: !currentRole.name, description: !currentRole.description };
    setErrors(newErrors);
    return !newErrors.name && !newErrors.description;
  };

  const handleOpen = (role: PeopleRole | null = null) => {
    if (role) {
      setCurrentRole(role);
      setIsEditing(true);
    } else {
      setCurrentRole({ name: '', description: '' });
      setIsEditing(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentRole({ name: '', description: '' });
    setErrors({ name: false, description: false });
  };

  const handleSave = async () => {
    if (validate()) {
      if (isEditing && currentRole.id) {
        await updatePeopleRole(currentRole.id, currentRole);
        showNotification('Rol actualizado exitosamente', 'success');
      } else {
        await createPeopleRole(currentRole as Omit<PeopleRole, 'id' | 'createdAt' | 'updatedAt'>);
        showNotification('Rol creado exitosamente', 'success');
      }
      fetchPeopleRoles();
      handleClose();
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setRoleToDelete({ id, name });
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (roleToDelete) {
      try {
        await deletePeopleRole(roleToDelete.id);
        setPeopleRoles(peopleRoles.filter(role => role.id !== roleToDelete.id));
        showNotification('Rol eliminado exitosamente', 'success');
      } catch (error: any) {
        if (error.response && error.response.status === 409) {
          showNotification(
            'Este rol de persona está en uso y no se puede eliminar.',
            'error'
          );
        } else {
          showNotification('Error al eliminar el rol de persona.', 'error');
        }
        console.error(error);
      } finally {
        setOpenConfirmDialog(false);
        setRoleToDelete(null);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentRole(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Typography variant="h4" gutterBottom>Roles de Personas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Crear Rol</Button>
      </div>
      <List>
        {peopleRoles.map((role) => (
          <ListItem
            key={role.id}
            disablePadding
            secondaryAction={
              <>
                <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(role)}>
                  <EditIcon />
                </IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(role.id, role.name)}>
                  <DeleteIcon />
                </IconButton>
              </>
            }
          >
            <ListItemButton>
              <ListItemText primary={role.name} secondary={role.description} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEditing ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus required error={errors.name} helperText={errors.name ? 'El nombre es requerido' : ''} margin="dense" label="Nombre del Rol" type="text" fullWidth variant="standard" name="name" value={currentRole.name} onChange={handleInputChange} />
          <TextField required error={errors.description} helperText={errors.description ? 'La descripción es requerida' : ''} margin="dense" label="Descripción del Rol" type="text" fullWidth variant="standard" name="description" value={currentRole.description} onChange={handleInputChange} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave}>{isEditing ? 'Guardar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {roleToDelete && (
        <ConfirmationDialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar el rol "${roleToDelete.name}"? Esta acción no se puede deshacer.`}
        />
      )}

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}