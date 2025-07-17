"use client";
import { useState, useEffect } from "react";
import { updatePerson } from "~/services/personService";
import { personSchema } from "./person.validators";
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
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
  baptismDate: string | null;
  convertionDate: string | null;
  birthdate: string | null;
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

  useEffect(() => {
    setFormData({
        firstname: person.firstname,
        lastname: person.lastname,
        address: person.address,
        phone: person.phone,
        gender: person.gender,
    });
    setBirthdate(person.birthdate ? dayjs(person.birthdate) : null);
    setConvertionDate(person.convertionDate ? dayjs(person.convertionDate) : null);
    setBaptismDate(person.baptismDate ? dayjs(person.baptismDate) : null);
    setErrors({});
  }, [person]);

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
      birthdate: birthdate ? birthdate.toISOString() : null,
      convertionDate: convertionDate ? convertionDate.toISOString() : null,
      baptismDate: baptismDate ? baptismDate.toISOString() : null,
    };

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
    <Card elevation={3} sx={{ borderRadius: 2, mb: 4, maxWidth: 600, margin: 'auto' }}>
      <CardHeader
        title="Editar Persona"
        titleTypographyProps={{ variant: 'h5', align: 'center' }}
      />
      <Divider />
      <CardContent>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 2 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                name="firstname"
                fullWidth
                value={formData.firstname}
                onChange={handleInputChange}
                error={!!errors.firstname}
                helperText={errors.firstname?.[0] || ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Apellido"
                name="lastname"
                fullWidth
                value={formData.lastname}
                onChange={handleInputChange}
                error={!!errors.lastname}
                helperText={errors.lastname?.[0] || ""}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Dirección"
                name="address"
                fullWidth
                value={formData.address}
                onChange={handleInputChange}
                error={!!errors.address}
                helperText={errors.address?.[0] || ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Teléfono"
                name="phone"
                fullWidth
                value={formData.phone}
                onChange={handleInputChange}
                error={!!errors.phone}
                helperText={errors.phone?.[0] || ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
                  <MenuItem value=""><em>Seleccionar género</em></MenuItem>
                  <MenuItem value="Masculino">Masculino</MenuItem>
                  <MenuItem value="Femenino">Femenino</MenuItem>
                </Select>
                {errors.gender && <FormHelperText>{errors.gender[0]}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Fecha de Nacimiento"
                value={birthdate}
                onChange={(newValue) => setBirthdate(newValue)}
                maxDate={yesterday}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.birthdate,
                    helperText: errors.birthdate ? errors.birthdate[0] : "",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Fecha de Conversión"
                value={convertionDate}
                onChange={(newValue) => setConvertionDate(newValue)}
                maxDate={yesterday}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.convertionDate,
                    helperText: errors.convertionDate ? errors.convertionDate[0] : "",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="Fecha de Bautismo"
                value={baptismDate}
                onChange={(newValue) => setBaptismDate(newValue)}
                maxDate={yesterday}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errors.baptismDate,
                    helperText: errors.baptismDate ? errors.baptismDate[0] : "",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outlined"
                  color="secondary"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EditPersonForm;