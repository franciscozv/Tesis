import {
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	CircularProgress,
	Divider,
	Grid,
	TextField,
} from "@mui/material";
import type React from "react";
import { useState } from "react";
import { createPlace } from "~/services/placeService";
import { placeSchema } from "./place.validators";

type Props = {
	onPlaceCreated?: () => void;
};

const CreatePlaceForm: React.FC<Props> = ({ onPlaceCreated }) => {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		address: "",
		phones: "",
		email: "",
		photoUrl: "",
		rooms: "",
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
		{},
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const result = placeSchema.safeParse(formData);

		if (!result.success) {
			setErrors(result.error.flatten().fieldErrors);
			return;
		}

		setErrors({});
		setLoading(true);

		try {
			await createPlace(result.data);
			setFormData({
				name: "",
				description: "",
				address: "",
				phones: "",
				email: "",
				photoUrl: "",
				rooms: "",
			});
			onPlaceCreated?.(); // Notifica al padre si existe
		} catch (error) {
			if (error instanceof Error) {
				alert(`Error al crear el lugar: ${error.message}`);
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
				title="Crear Nuevo Lugar"
				titleTypographyProps={{ variant: "h5", align: "center" }}
			/>
			<Divider />
			<CardContent>
				<Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<TextField
								label="Nombre del lugar"
								name="name"
								fullWidth
								value={formData.name}
								onChange={handleChange}
								error={!!errors.name}
								helperText={errors.name ? errors.name[0] : ""}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Descripción"
								name="description"
								fullWidth
								multiline
								rows={4}
								value={formData.description}
								onChange={handleChange}
								error={!!errors.description}
								helperText={
									errors.description ? errors.description[0] : ""
								}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Dirección"
								name="address"
								fullWidth
								value={formData.address}
								onChange={handleChange}
								error={!!errors.address}
								helperText={errors.address ? errors.address[0] : ""}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Teléfonos"
								name="phones"
								fullWidth
								value={formData.phones}
								onChange={handleChange}
								error={!!errors.phones}
								helperText={errors.phones ? errors.phones[0] : ""}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Email"
								name="email"
								fullWidth
								value={formData.email}
								onChange={handleChange}
								error={!!errors.email}
								helperText={errors.email ? errors.email[0] : ""}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="URL de la foto"
								name="photoUrl"
								fullWidth
								value={formData.photoUrl}
								onChange={handleChange}
								error={!!errors.photoUrl}
								helperText={errors.photoUrl ? errors.photoUrl[0] : ""}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Salas"
								name="rooms"
								fullWidth
								value={formData.rooms}
								onChange={handleChange}
								error={!!errors.rooms}
								helperText={errors.rooms ? errors.rooms[0] : ""}
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
								{loading ? "Creando..." : "Crear Lugar"}
							</Button>
						</Grid>
					</Grid>
				</Box>
			</CardContent>
		</Card>
	);
};

export default CreatePlaceForm;
