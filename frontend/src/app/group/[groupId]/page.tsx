"use client";

import { getGroup, updateGroup } from "~/services/groupService";
import { getPeopleInGroup, addPersonToGroup, removePersonFromGroup } from "~/services/peopleOnGroupsService";
import { getPeople } from "~/services/personService";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from 'next/navigation';
import { 
  Container, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Autocomplete, 
  TextField,
  Box,
  Collapse,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import CakeIcon from '@mui/icons-material/Cake';
import EventIcon from '@mui/icons-material/Event';

const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];


import { getRolesForGroup, assignRoleToGroup, removeRoleFromGroup } from "~/services/groupRoleAssignmentService";
import { getPeopleRoles } from "~/services/peopleRoleService";

function MemberRow(props: { row: any; onRemove: (id: number) => void }) {
  const { row } = props;
  const [open, setOpen] = useState(false);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES');

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {`${row.person.firstname} ${row.person.lastname}`}
        </TableCell>
        <TableCell>{row.personRole?.name || 'Sin rol'}</TableCell>
        <TableCell>{row.status}</TableCell>
        <TableCell align="right">
          <IconButton onClick={() => props.onRemove(row.person.id)}>
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Detalles
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><Typography><HomeIcon sx={{verticalAlign: 'middle', mr: 1}}/> <b>Dirección:</b> {row.person.address}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><PhoneIcon sx={{verticalAlign: 'middle', mr: 1}}/> <b>Teléfono:</b> {row.person.phone}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><CakeIcon sx={{verticalAlign: 'middle', mr: 1}}/> <b>Nacimiento:</b> {formatDate(row.person.birthdate)}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><EventIcon sx={{verticalAlign: 'middle', mr: 1}}/> <b>Bautismo:</b> {formatDate(row.person.baptismDate)}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><EventIcon sx={{verticalAlign: 'middle', mr: 1}}/> <b>Conversión:</b> {formatDate(row.person.convertionDate)}</Typography></Grid>
                <Grid item xs={12} sm={6}><Typography><b>Género:</b> {row.person.gender}</Typography></Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = parseInt(params.groupId as string, 10);
  const [group, setGroup] = useState<any>(null);
  const [peopleInGroup, setPeopleInGroup] = useState<any[]>([]);
  const [allPeople, setAllPeople] = useState<any[]>([]);
  const [groupRoles, setGroupRoles] = useState<any[]>([]);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openAddRole, setOpenAddRole] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [editedGroup, setEditedGroup] = useState<any>(null);
  const [errors, setErrors] = useState({ name: false, description: false });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const fetchGroupData = useCallback(async () => {
    const groupData = await getGroup(groupId);
    setGroup(groupData);
    setEditedGroup(groupData);
    const peopleInGroupData = await getPeopleInGroup(groupId);
    setPeopleInGroup(peopleInGroupData);
    const allPeopleData = await getPeople();
    setAllPeople(allPeopleData);
    const groupRolesData = await getRolesForGroup(groupId);
    setGroupRoles(groupRolesData);
    const allRolesData = await getPeopleRoles();
    setAllRoles(allRolesData);
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId, fetchGroupData]);

  const validate = () => {
    if (!editedGroup) return false;
    const newErrors = { name: editedGroup.name === '', description: editedGroup.description === '' };
    setErrors(newErrors);
    return !newErrors.name && !newErrors.description;
  };

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => {
    setOpenAdd(false);
    setSelectedPerson(null);
    setTimeout(() => headingRef.current?.focus(), 0);
  };

  const handleOpenEdit = () => setOpenEdit(true);
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setErrors({ name: false, description: false });
    setTimeout(() => headingRef.current?.focus(), 0);
  };

  const handleOpenAddRole = () => setOpenAddRole(true);
  const handleCloseAddRole = () => {
    setOpenAddRole(false);
    setSelectedRole(null);
  };

  const handleAddPerson = async () => {
    if (selectedPerson && selectedRole) {
      await addPersonToGroup({ personId: selectedPerson.id, groupId, personRoleId: selectedRole.id });
      showNotification('Miembro añadido exitosamente', 'success');
      fetchGroupData();
      handleCloseAdd();
    }
  };

  const handleRemovePerson = async (personId: number) => {
    await removePersonFromGroup(personId, groupId);
    showNotification('Miembro eliminado exitosamente', 'success');
    fetchGroupData();
  };

  const handleAddRole = async () => {
    if (selectedRole) {
      await assignRoleToGroup(groupId, selectedRole.id);
      showNotification('Rol asignado exitosamente', 'success');
      fetchGroupData();
      handleCloseAddRole();
    }
  };

  const handleRemoveRole = async (roleId: number) => {
    await removeRoleFromGroup(groupId, roleId);
    showNotification('Rol eliminado exitosamente', 'success');
    fetchGroupData();
  };

  const handleUpdateGroup = async () => {
    if (validate()) {
      await updateGroup(groupId, editedGroup);
      showNotification('Grupo actualizado exitosamente', 'success');
      fetchGroupData();
      handleCloseEdit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedGroup((prev: any) => ({ ...prev, [name]: value }));
  };

  if (!group) {
    return <div>Cargando...</div>;
  }

  return (
    <Container>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2}}>
          <Box sx={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: group.color, flexShrink: 0 }} />
          <Typography variant="h4" gutterBottom ref={headingRef} tabIndex={-1} sx={{ mb: 0 }}>{group.name}</Typography>
        </Box>
        <Button variant="contained" startIcon={<EditIcon />} onClick={handleOpenEdit}>Editar Grupo</Button>
      </Box>
      
      <Typography variant="h6" sx={{mt: 3}}>Misión</Typography>
      <Typography paragraph>{group.mision || 'No definida'}</Typography>
      <Typography variant="h6">Visión</Typography>
      <Typography paragraph>{group.vision || 'No definida'}</Typography>
      
      <Typography variant="h5" sx={{mt: 4, mb: 2}}>Miembros</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ mb: 2 }}>
        Añadir Miembro
      </Button>

      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Nombre</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {peopleInGroup.map((p) => (
              <MemberRow key={p.person.id} row={p} onRemove={handleRemovePerson} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" sx={{mt: 4, mb: 2}}>Roles del Grupo</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAddRole} sx={{ mb: 2 }}>
        Añadir Rol
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groupRoles.map((assignment) => (
              <TableRow key={assignment.role.id}>
                <TableCell>{assignment.role.name}</TableCell>
                <TableCell>{assignment.role.description}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleRemoveRole(assignment.role.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Person Dialog */}
      <Dialog open={openAdd} onClose={handleCloseAdd}>
        <DialogTitle>Añadir Nuevo Miembro</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={allPeople.filter(p => !peopleInGroup.some(pg => pg.person.id === p.id))}
            getOptionLabel={(option) => `${option.firstname} ${option.lastname}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(event, newValue) => {
              setSelectedPerson(newValue);
            }}
            renderInput={(params) => <TextField {...params} label="Persona" margin="dense" />}
          />
          <Autocomplete
            options={groupRoles.map(gr => gr.role)}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(event, newValue) => {
              setSelectedRole(newValue);
            }}
            renderInput={(params) => <TextField {...params} label="Rol" margin="dense" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancelar</Button>
          <Button onClick={handleAddPerson} disabled={!selectedPerson || !selectedRole}>Añadir</Button>
        </DialogActions>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={openAddRole} onClose={handleCloseAddRole}>
        <DialogTitle>Añadir Rol al Grupo</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={allRoles.filter(r => !groupRoles.some(gr => gr.role.id === r.id))}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(event, newValue) => {
              setSelectedRole(newValue);
            }}
            renderInput={(params) => <TextField {...params} label="Rol" margin="dense" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddRole}>Cancelar</Button>
          <Button onClick={handleAddRole}>Añadir</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={openEdit} onClose={handleCloseEdit}>
        <DialogTitle>Editar Grupo</DialogTitle>
        <DialogContent>
        <TextField autoFocus required error={errors.name} helperText={errors.name ? 'El nombre es requerido' : ''} margin="dense" label="Nombre del Grupo" type="text" fullWidth variant="standard" name="name" value={editedGroup?.name || ''} onChange={handleInputChange} />
          <TextField required error={errors.description} helperText={errors.description ? 'La descripción es requerida' : ''} margin="dense" label="Descripción del Grupo" type="text" fullWidth variant="standard" name="description" value={editedGroup?.description || ''} onChange={handleInputChange} />
          <TextField margin="dense" label="Misión" type="text" fullWidth variant="standard" name="mision" value={editedGroup?.mision || ''} onChange={handleInputChange} />
          <TextField margin="dense" label="Visión" type="text" fullWidth variant="standard" name="vision" value={editedGroup?.vision || ''} onChange={handleInputChange} />
          <Typography sx={{ mt: 2 }}>Color</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {colors.map(color => (
              <Box key={color} onClick={() => setEditedGroup((prev: any) => ({ ...prev, color }))} sx={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: color, cursor: 'pointer', border: editedGroup?.color === color ? '2px solid #1976d2' : '2px solid transparent' }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button onClick={handleUpdateGroup} disabled={!editedGroup?.name || !editedGroup?.description}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}