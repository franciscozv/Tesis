import { useState, useEffect } from "react";
import { updatePerson } from "~/services/personService";
import { personSchema } from "./person.validators";
import {
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";

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

type Props = {
  person: Person;
  onUpdate: () => void;
  onCancel: () => void;
};

const EditPersonForm: React.FC<Props> = ({ person, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState(person);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  useEffect(() => {
    // Ensure dates are in YYYY-MM-DD format for TextField type="date"
    setFormData({
      ...person,
      birthdate: person.birthdate ? new Date(person.birthdate).toISOString().split('T')[0] : '',
      convertionDate: person.convertionDate ? new Date(person.convertionDate).toISOString().split('T')[0] : '',
      baptismDate: person.baptismDate ? new Date(person.baptismDate).toISOString().split('T')[0] : '',
    });
  }, [person]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = personSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await updatePerson(person.id, result.data);
      onUpdate();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error al actualizar persona: ${err.message}`);
      } else {
        alert("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        maxWidth: 600,
        mx: "auto",
        p: 3,
        border: "1px solid #ccc",
        borderRadius: 2,
        boxShadow: 1,
        mb: 4, // Add some margin bottom
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Editar Persona
      </Typography>

      <TextField
        label="Nombre"
        name="firstname"
        variant="outlined"
        fullWidth
        value={formData.firstname}
        onChange={handleChange}
        error={!!errors.firstname}
        helperText={errors.firstname ? errors.firstname[0] : ""}
      />

      <TextField
        label="Apellido"
        name="lastname"
        variant="outlined"
        fullWidth
        value={formData.lastname}
        onChange={handleChange}
        error={!!errors.lastname}
        helperText={errors.lastname ? errors.lastname[0] : ""}
      />

      <TextField
        label="Dirección"
        name="address"
        variant="outlined"
        fullWidth
        value={formData.address}
        onChange={handleChange}
        error={!!errors.address}
        helperText={errors.address ? errors.address[0] : ""}
      />

      <TextField
        label="Teléfono"
        name="phone"
        variant="outlined"
        fullWidth
        value={formData.phone}
        onChange={handleChange}
        error={!!errors.phone}
        helperText={errors.phone ? errors.phone[0] : ""}
      />

      <TextField
        label="Fecha de Nacimiento"
        name="birthdate"
        type="date"
        variant="outlined"
        fullWidth
        value={formData.birthdate}
        onChange={handleChange}
        InputLabelProps={{
          shrink: true,
        }}
        error={!!errors.birthdate}
        helperText={errors.birthdate ? errors.birthdate[0] : ""}
      />

      <TextField
        label="Fecha de Conversión"
        name="convertionDate"
        type="date"
        variant="outlined"
        fullWidth
        value={formData.convertionDate}
        onChange={handleChange}
        InputLabelProps={{
          shrink: true,
        }}
        error={!!errors.convertionDate}
        helperText={errors.convertionDate ? errors.convertionDate[0] : ""}
      />

      <TextField
        label="Fecha de Bautismo"
        name="baptismDate"
        type="date"
        variant="outlined"
        fullWidth
        value={formData.baptismDate}
        onChange={handleChange}
        InputLabelProps={{
          shrink: true,
        }}
        error={!!errors.baptismDate}
        helperText={errors.baptismDate ? errors.baptismDate[0] : ""}
      />

      <FormControl fullWidth error={!!errors.gender}>
        <InputLabel id="gender-select-label">Género</InputLabel>
        <Select
          labelId="gender-select-label"
          id="gender-select"
          name="gender"
          value={formData.gender}
          label="Género"
          onChange={handleChange}
        >
          <MenuItem value="">Seleccionar género</MenuItem>
          <MenuItem value="Masculino">Masculino</MenuItem>
          <MenuItem value="Femenino">Femenino</MenuItem>
        </Select>
        {errors.gender && <FormHelperText>{errors.gender[0]}</FormHelperText>}
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
          sx={{ flexGrow: 1 }}
        >
          {loading ? "Actualizando..." : "Actualizar Persona"}
        </Button>
        <Button
          type="button"
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          disabled={loading}
          sx={{ flexGrow: 1 }}
        >
          Cancelar
        </Button>
      </Box>
    </Box>
  );
};

export default EditPersonForm;
