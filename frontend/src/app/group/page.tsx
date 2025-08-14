'use client';

import { useEffect, useState } from 'react';
import { getGroups, createGroup, deleteGroup } from '~/services/groupService';
import { Grid, Card, CardContent, CardActionArea, CardActions, Typography, Container, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Snackbar, Alert } from '@mui/material';
import Link from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmationDialog from '~/components/ui/ConfirmationDialog';

const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', mision: '', vision: '', color: colors[0] });
  const [errors, setErrors] = useState({ name: false, description: false });
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{ id: number; name: string } | null>(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const fetchGroups = async () => {
    const groupsData = await getGroups();
    setGroups(groupsData);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const validate = () => {
    const newErrors = { name: newGroup.name === '', description: newGroup.description === '' };
    setErrors(newErrors);
    return !newErrors.name && !newErrors.description;
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setNewGroup({ name: '', description: '', mision: '', vision: '', color: colors[0] });
    setErrors({ name: false, description: false });
  };

  const handleCreateGroup = async () => {
    if (validate()) {
      await createGroup(newGroup);
      fetchGroups();
      showNotification('Grupo creado exitosamente', 'success');
      handleClose();
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setGroupToDelete({ id, name });
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (groupToDelete) {
      const res = await deleteGroup(groupToDelete.id);
      if (res.success) {
        showNotification(res.message, 'success');
        fetchGroups();
      } else {
        showNotification(res.message, 'error');
      }
      setOpenConfirmDialog(false);
      setGroupToDelete(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewGroup(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Typography variant="h4" gutterBottom>Grupos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>Crear Grupo</Button>
      </div>
      <Grid container spacing={2}>
        {groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card sx={{ backgroundColor: "#F1ECEE", borderRadius: "16px", height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { backgroundColor: '#DCDAF5' } }}>
              <CardActionArea component={Link} href={`/group/${group.id}`} sx={{ flexGrow: 1 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: group.color, mr: 2, flexShrink: 0 }} />
                    <Typography variant="h6" component="div">
                      {group.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {group.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(group.id, group.name)} disabled={group._count?.members > 0}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Crear Nuevo Grupo</DialogTitle>
        <DialogContent>
          <TextField autoFocus required error={errors.name} helperText={errors.name ? 'El nombre es requerido' : ''} margin="dense" label="Nombre del Grupo" type="text" fullWidth variant="standard" name="name" value={newGroup.name} onChange={handleInputChange} />
          <TextField required error={errors.description} helperText={errors.description ? 'La descripción es requerida' : ''} margin="dense" label="Descripción del Grupo" type="text" fullWidth variant="standard" name="description" value={newGroup.description} onChange={handleInputChange} />
          <TextField margin="dense" label="Misión" type="text" fullWidth variant="standard" name="mision" value={newGroup.mision} onChange={handleInputChange} />
          <TextField margin="dense" label="Visión" type="text" fullWidth variant="standard" name="vision" value={newGroup.vision} onChange={handleInputChange} />
          <Typography sx={{ mt: 2 }}>Color</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {colors.map(color => (
              <Box key={color} onClick={() => setNewGroup(prev => ({ ...prev, color }))} sx={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: color, cursor: 'pointer', border: newGroup.color === color ? '2px solid #1976d2' : '2px solid transparent' }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleCreateGroup} disabled={!newGroup.name || !newGroup.description}>Crear</Button>
        </DialogActions>
      </Dialog>

      {groupToDelete && (
        <ConfirmationDialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Confirmar Eliminación"
          description={`¿Estás seguro de que deseas eliminar el grupo "${groupToDelete.name}"? Esta acción no se puede deshacer.`}
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
