"use client";
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
import type { SelectChangeEvent } from "@mui/material/Select";

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

function formatDateForInput(dateString: string | undefined | null): string {
  // 1. Validación de entrada
  if (
    dateString === null ||
    dateString === undefined ||
    typeof dateString !== "string"
  ) {
    return "";
  }

  // 2. Limpieza del string
  const cleanedDateString = dateString.trim();
  if (cleanedDateString === "") {
    return "";
  }

  // 3. Parseo y validación de fecha
  const timestamp = Date.parse(cleanedDateString);
  if (isNaN(timestamp)) {
    return "";
  }

  // 4. Creación y verificación de fecha
  const date = new Date(timestamp);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }

  // 5. Formateo seguro con verificación de resultado
  try {
    const isoString = date.toISOString();
    const datePart = isoString.split("T")[0] ?? "";
    return datePart;
  } catch {
    return "";
  }
}

const EditPersonForm: React.FC<Props> = ({ person, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState<Person>({
    ...person,
    birthdate: formatDateForInput(person.birthdate),
    convertionDate: formatDateForInput(person.convertionDate),
    baptismDate: formatDateForInput(person.baptismDate),
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = personSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await updatePerson(person.id, result.data);
      onUpdate();
    } catch (err) {
      alert(
        err instanceof Error ? `Error: ${err.message}` : "Error desconocido"
      );
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
        mb: 4,
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
        onChange={handleInputChange}
        error={!!errors.firstname}
        helperText={errors.firstname?.[0] || ""}
      />

      <TextField
        label="Apellido"
        name="lastname"
        variant="outlined"
        fullWidth
        value={formData.lastname}
        onChange={handleInputChange}
        error={!!errors.lastname}
        helperText={errors.lastname?.[0] || ""}
      />

      <TextField
        label="Dirección"
        name="address"
        variant="outlined"
        fullWidth
        value={formData.address}
        onChange={handleInputChange}
        error={!!errors.address}
        helperText={errors.address?.[0] || ""}
      />

      <TextField
        label="Teléfono"
        name="phone"
        variant="outlined"
        fullWidth
        value={formData.phone}
        onChange={handleInputChange}
        error={!!errors.phone}
        helperText={errors.phone?.[0] || ""}
      />

      <TextField
        label="Fecha de Nacimiento"
        name="birthdate"
        type="date"
        variant="outlined"
        fullWidth
        value={formData.birthdate}
        onChange={handleInputChange}
        InputLabelProps={{ shrink: true }}
        error={!!errors.birthdate}
        helperText={errors.birthdate?.[0] || ""}
      />

      <TextField
        label="Fecha de Conversión"
        name="convertionDate"
        type="date"
        variant="outlined"
        fullWidth
        value={formData.convertionDate}
        onChange={handleInputChange}
        InputLabelProps={{ shrink: true }}
        error={!!errors.convertionDate}
        helperText={errors.convertionDate?.[0] || ""}
      />

      <TextField
        label="Fecha de Bautismo"
        name="baptismDate"
        type="date"
        variant="outlined"
        fullWidth
        value={formData.baptismDate}
        onChange={handleInputChange}
        InputLabelProps={{ shrink: true }}
        error={!!errors.baptismDate}
        helperText={errors.baptismDate?.[0] || ""}
      />

      <FormControl fullWidth error={!!errors.gender}>
        <InputLabel id="gender-select-label">Género</InputLabel>
        <Select
          labelId="gender-select-label"
          id="gender-select"
          name="gender"
          value={formData.gender}
          label="Género"
          onChange={handleSelectChange}
        >
          <MenuItem value="">Seleccionar género</MenuItem>
          <MenuItem value="Masculino">Masculino</MenuItem>
          <MenuItem value="Femenino">Femenino</MenuItem>
        </Select>
        {errors.gender && <FormHelperText>{errors.gender[0]}</FormHelperText>}
      </FormControl>

      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
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
