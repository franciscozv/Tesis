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
import ColorPicker from "~/components/ui/ColorPicker";
import { createEventType } from "~/services/eventTypeService";
import { eventTypeSchema } from "./eventType.validators";

type Props = {
	onEventTypeCreated?: () => void;
};

const CreateEventTypeForm: React.FC<Props> = ({ onEventTypeCreated }) => {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [color, setColor] = useState("#000000");
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string[] | undefined>>(
		{},
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const result = eventTypeSchema.safeParse({ name, description, color });

		if (!result.success) {
			setErrors(result.error.flatten().fieldErrors);
			return;
		}

		setErrors({});
		setLoading(true);

		try {
			await createEventType({
				...result.data,
				description: result.data.description ?? "",
				color,
			});
			setName("");
			setDescription("");
			onEventTypeCreated?.(); // Notifica al padre si existe
		} catch (error) {
			if (error instanceof Error) {
				alert(`Error al crear tipo de evento: ${error.message}`);
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
				title="Crear Nuevo Tipo de Evento"
				titleTypographyProps={{ variant: "h5", align: "center" }}
			/>
			<Divider />
			<CardContent>
				<Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<TextField
								label="Nombre del tipo de evento"
								fullWidth
								value={name}
								onChange={(e) => setName(e.target.value)}
								error={!!errors.name}
								helperText={errors.name ? errors.name[0] : ""}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								label="Descripción"
								fullWidth
								multiline
								rows={4}
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								error={!!errors.description}
								helperText={errors.description ? errors.description[0] : ""}
							/>
						</Grid>
						<Grid item xs={12}>
							<ColorPicker selectedColor={color} onColorChange={setColor} />
						</Grid>

						<Grid item xs={12}>
							<Button
								type="submit"
								variant="contained"
								color="primary"
								disabled={loading}
								startIcon={loading ? <CircularProgress size={20} /> : null}
							>
								{loading ? "Creando..." : "Crear Tipo de Evento"}
							</Button>
						</Grid>
					</Grid>
				</Box>
			</CardContent>
		</Card>
	);
};

export default CreateEventTypeForm;
