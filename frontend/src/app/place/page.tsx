"use client";
import { Alert, Box, CircularProgress, Snackbar, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";
import { DataTable } from "~/components/ui/DataTable";
import { deletePlace, getPlaces, updatePlace } from "~/services/placeService";
import CreatePlaceForm from "../../components/features/place/CreatePlaceForm";
import { getColumns, type Place } from "./columns";
import { placeSchema } from "~/components/features/place/place.validators";

const Page = () => {
	const [places, setPlaces] = useState<Place[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingRowId, setEditingRowId] = useState<number | null>(null);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
	const [placeToDelete, setPlaceToDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [notification, setNotification] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error" | "warning" | "info";
	}>({ open: false, message: "", severity: "info" });

	const fetchData = async () => {
		setLoading(true);
		try {
			const data = await getPlaces();
			setPlaces(data || []);
		} catch (error) {
			console.error("Error al obtener los lugares:", error);
			showNotification("Error al cargar los lugares", "error");
		} finally {
			setLoading(false);
		}
	};

	const showNotification = (
		message: string,
		severity: "success" | "error" | "warning" | "info",
	) => {
		setNotification({ open: true, message, severity });
	};

	const handleCloseNotification = () => {
		setNotification((prev) => ({ ...prev, open: false }));
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleDelete = (id: number, name: string) => {
		setPlaceToDelete({ id, name });
		setOpenConfirmDialog(true);
	};

	const handleConfirmDelete = async () => {
		if (placeToDelete) {
			try {
				await deletePlace(placeToDelete.id);
				fetchData(); // Refrescar datos
				showNotification("Lugar eliminado exitosamente", "success");
			} catch (error) {
				console.error("Error al eliminar el lugar:", error);

				if (
					error instanceof Error &&
					"status" in error &&
					error.status === 409
				) {
					showNotification(
						"No se puede eliminar el lugar porque está siendo utilizado por uno o más eventos.",
						"warning",
					);
				} else if (
					error instanceof Error &&
					error.message.includes("could not be deleted")
				) {
					showNotification(
						"No se puede eliminar el lugar porque está siendo utilizado por uno o más eventos.",
						"warning",
					);
				} else {
					showNotification("Error al eliminar el lugar", "error");
				}
			} finally {
				setOpenConfirmDialog(false);
				setPlaceToDelete(null);
			}
		}
	};

	const handleCancelDelete = () => {
		setOpenConfirmDialog(false);
		setPlaceToDelete(null);
	};

	const handlePlaceUpdate = (
		rowIndex: number,
		columnId: string,
		value: any,
	) => {
		setPlaces((old) =>
			old.map((row, index) => {
				if (index === rowIndex) {
					return {
						...row,
						[columnId]: value,
					};
				}
				return row;
			}),
		);
	};

	const handleSave = async (placeId: number) => {
		const placeToUpdate = places.find((p) => p.id === placeId);
		if (placeToUpdate) {
			const validationResult = placeSchema.safeParse(placeToUpdate);
			if (!validationResult.success) {
				const newErrors: Record<string, string> = {};
				for (const [key, value] of Object.entries(
					validationResult.error.flatten().fieldErrors,
				)) {
					if (value) newErrors[key] = value.join(", ");
				}
				setValidationErrors(newErrors);
				return; // Detener si hay errores
			}

			setValidationErrors({}); // Limpiar errores si la validación es exitosa
			try {
				await updatePlace(placeId, validationResult.data);
				setEditingRowId(null); // Salir del modo edición
				showNotification("Lugar actualizado exitosamente", "success");
			} catch (error) {
				console.error("Error al actualizar el lugar:", error);
				showNotification("Error al actualizar el lugar", "error");
				fetchData(); // Revertir cambios si falla la API
			}
		}
	};

	const handleCancel = () => {
		setEditingRowId(null);
		setValidationErrors({}); // Limpiar errores al cancelar
		fetchData(); // Recargar datos originales
	};

	const columns = useMemo(() => getColumns(handleDelete), []);

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Gestión de Lugares
			</Typography>

			<Box sx={{ my: 4 }}>
				<CreatePlaceForm onPlaceCreated={fetchData} />
			</Box>

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
					<CircularProgress />
					<Typography variant="body1" sx={{ ml: 2 }}>
						Cargando lugares...
					</Typography>
				</Box>
			) : (
				<DataTable
					columns={columns}
					data={places}
					meta={{
						editingRowId,
						setEditingRowId,
						updateData: handlePlaceUpdate,
						saveRow: handleSave,
						cancelEdit: handleCancel,
						validationErrors,
					}}
				/>
			)}

			{placeToDelete && (
				<ConfirmationDialog
					open={openConfirmDialog}
					onClose={handleCancelDelete}
					onConfirm={handleConfirmDelete}
					title="Confirmar Eliminación"
					description={`¿Estás seguro de que deseas eliminar el lugar "${placeToDelete.name}"? Esta acción no se puede deshacer.`}
				/>
			)}

			<Snackbar
				open={notification.open}
				autoHideDuration={6000}
				onClose={handleCloseNotification}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
			>
				<Alert
					onClose={handleCloseNotification}
					severity={notification.severity}
					sx={{ width: "100%" }}
				>
					{notification.message}
				</Alert>
			</Snackbar>
		</Box>
	);
};

export default Page;
