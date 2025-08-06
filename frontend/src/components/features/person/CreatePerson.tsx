"use client";
import {
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	Divider,
	FormControl,
	FormHelperText,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { createPerson } from "~/services/personService";
import { personSchema } from "./person.validators";

type Props = {
	onPersonCreated: () => void;
};

const CreatePerson: React.FC<Props> = ({ onPersonCreated }) => {
	const [formData, setFormData] = useState({
		firstname: "",
		lastname: "",
		address: "",
		phone: "",
		gender: "",
	});
	const [birthdate, setBirthdate] = useState<Dayjs | null>(null);
	const [convertionDate, setConvertionDate] = useState<Dayjs | null>(null);
	const [baptismDate, setBaptismDate] = useState<Dayjs | null>(null);

	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
		{},
	);

	const yesterday = dayjs().subtract(1, "day");

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSelectChange = (e: SelectChangeEvent<string>) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name as string]: value });
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

		setErrors({});
		setLoading(true);
		try {
			await createPerson(result.data);
			// Reset form
			setFormData({
				firstname: "",
				lastname: "",
				address: "",
				phone: "",
				gender: "",
			});
			setBirthdate(null);
			setConvertionDate(null);
			setBaptismDate(null);
			onPersonCreated();
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
		<Card elevation={3} sx={{ borderRadius: 2, maxWidth: 600, margin: "auto" }}>
			<CardHeader
				title="Crear Nueva Persona"
				titleTypographyProps={{ variant: "h5", align: "center" }}
			/>
			<Divider />
			<CardContent>
				<Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
					<Grid container spacing={3}>
						<Grid item xs={12} sm={6}>
							<TextField
								label="Nombre"
								name="firstname"
								fullWidth
								value={formData.firstname}
								onChange={handleInputChange}
								error={!!errors.firstname}
								helperText={errors.firstname ? errors.firstname[0] : ""}
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
								helperText={errors.lastname ? errors.lastname[0] : ""}
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
								helperText={errors.address ? errors.address[0] : ""}
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
								helperText={errors.phone ? errors.phone[0] : ""}
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
									<MenuItem value="">
										<em>Seleccionar género</em>
									</MenuItem>
									<MenuItem value="MASCULINO">Masculino</MenuItem>
									<MenuItem value="FEMENINO">Femenino</MenuItem>
								</Select>
								{errors.gender && (
									<FormHelperText>{errors.gender[0]}</FormHelperText>
								)}
							</FormControl>
						</Grid>
						<Grid item xs={12} sm={6}>
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
						<Grid item xs={12} sm={6}>
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
										helperText: errors.convertionDate
											? errors.convertionDate[0]
											: "",
									},
								}}
							/>
						</Grid>
						<Grid item xs={12} sm={6}>
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
							<Button
								type="submit"
								variant="contained"
								color="primary"
								disabled={loading}
								startIcon={loading ? <CircularProgress size={20} /> : null}
							>
								{loading ? "Creando..." : "Crear Persona"}
							</Button>
						</Grid>
					</Grid>
				</Box>
			</CardContent>
		</Card>
	);
};

export default CreatePerson;