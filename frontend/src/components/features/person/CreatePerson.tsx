"use client";
import { useState } from "react";
import { createPerson } from "~/services/personService";
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

type Props = {
  onPersonCreated?: () => void;
};

const CreatePerson: React.FC<Props> = ({ onPersonCreated }) => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    address: "",
    phone: "",
    birthdate: "",
    convertionDate: "",
    baptismDate: "",
    gender: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

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
      await createPerson(result.data);
      setFormData({
        firstname: "",
        lastname: "",
        address: "",
        phone: "",
        birthdate: "",
        convertionDate: "",
        baptismDate: "",
        gender: "",
      });
      onPersonCreated?.();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error al crear persona: ${err.message}`);
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
      }}
    >
      <Typography variant="h5" component="h2" gutterBottom>
        Crear Persona
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

      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : null}
      >
        {loading ? "Creando..." : "Crear Persona"}
      </Button>
    </Box>
  );
};

export default CreatePerson;
