"use client";
import { useState } from "react";
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
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { type Dayjs } from "dayjs";
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

const EditPersonForm: React.FC<Props> = ({ person, onUpdate, onCancel }) => {
  const [formData, setFormData] = useState({
    firstname: person.firstname,
    lastname: person.lastname,
    address: person.address,
    phone: person.phone,
    gender: person.gender,
  });

  const [birthdate, setBirthdate] = useState<Dayjs | null>(
    person.birthdate ? dayjs(person.birthdate) : null
  );
  const [convertionDate, setConvertionDate] = useState<Dayjs | null>(
    person.convertionDate ? dayjs(person.convertionDate) : null
  );
  const [baptismDate, setBaptismDate] = useState<Dayjs | null>(
    person.baptismDate ? dayjs(person.baptismDate) : null
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
    {}
  );

  const yesterday = dayjs().subtract(1, 'day');

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

    const dataToValidate = {
        ...formData,
        birthdate: birthdate ? birthdate.toISOString() : "",
        convertionDate: convertionDate ? convertionDate.toISOString() : "",
        baptismDate: baptismDate ? baptismDate.toISOString() : "",
    }

    const result = personSchema.safeParse(dataToValidate);

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

      <DatePicker
        label="Fecha de Nacimiento"
        value={birthdate}
        onChange={(newValue) => setBirthdate(newValue)}
        maxDate={yesterday}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
            error: !!errors.birthdate,
            helperText: errors.birthdate ? errors.birthdate[0] : "",
          },
        }}
      />

      <DatePicker
        label="Fecha de Conversión"
        value={convertionDate}
        onChange={(newValue) => setConvertionDate(newValue)}
        maxDate={yesterday}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
            error: !!errors.convertionDate,
            helperText: errors.convertionDate ? errors.convertionDate[0] : "",
          },
        }}
      />

      <DatePicker
        label="Fecha de Bautismo"
        value={baptismDate}
        onChange={(newValue) => setBaptismDate(newValue)}
        maxDate={yesterday}
        slotProps={{
          textField: {
            fullWidth: true,
            variant: "outlined",
            error: !!errors.baptismDate,
            helperText: errors.baptismDate ? errors.baptismDate[0] : "",
          },
        }}
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
