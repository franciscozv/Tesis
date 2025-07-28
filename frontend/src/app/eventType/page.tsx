"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { eventTypeSchema } from "~/components/features/eventType/eventType.validators";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";
import { DataTable } from "~/components/ui/DataTable";
import {
	deleteEventType,
	getEventTypes,
	updateEventType,
} from "~/services/eventTypeService";
import CreateEventTypeForm from "../../components/features/eventType/CreateEventTypeForm";
import { type EventType, getColumns } from "./columns";

const Page = () => {
	const [eventTypes, setEventTypes] = useState<EventType[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingRowId, setEditingRowId] = useState<number | null>(null);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
	const [eventTypeToDelete, setEventTypeToDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);

	const fetchData = async () => {
		setLoading(true);
		try {
			const data = await getEventTypes();
			setEventTypes(data || []);
		} catch (error) {
			console.error("Error al obtener tipos de evento:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleDelete = (id: number, name: string) => {
		setEventTypeToDelete({ id, name });
		setOpenConfirmDialog(true);
	};

	const handleConfirmDelete = async () => {
		if (eventTypeToDelete) {
			try {
				await deleteEventType(eventTypeToDelete.id);
				fetchData(); // Refrescar datos
			} catch (error) {
				console.error("Error al eliminar el tipo de evento:", error);
				alert("Error al eliminar el tipo de evento");
			} finally {
				setOpenConfirmDialog(false);
				setEventTypeToDelete(null);
			}
		}
	};

	const handleCancelDelete = () => {
		setOpenConfirmDialog(false);
		setEventTypeToDelete(null);
	};

	const handleEventTypeUpdate = (
		rowIndex: number,
		columnId: string,
		value: any,
	) => {
		setEventTypes((old) =>
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

	const handleSave = async (eventTypeId: number) => {
		const eventTypeToUpdate = eventTypes.find((et) => et.id === eventTypeId);
		if (eventTypeToUpdate) {
			const validationResult = eventTypeSchema.safeParse(eventTypeToUpdate);
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
				await updateEventType(eventTypeId, validationResult.data);
				setEditingRowId(null); // Salir del modo edición
			} catch (error) {
				console.error("Error al actualizar el tipo de evento:", error);
				alert("Error al actualizar el tipo de evento");
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
				Gestión de Tipos de Evento
			</Typography>

			<Box sx={{ my: 4 }}>
				<CreateEventTypeForm onEventTypeCreated={fetchData} />
			</Box>

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
					<CircularProgress />
					<Typography variant="body1" sx={{ ml: 2 }}>
						Cargando tipos de evento...
					</Typography>
				</Box>
			) : (
				<DataTable
					columns={columns}
					data={eventTypes}
					meta={{
						editingRowId,
						setEditingRowId,
						updateData: handleEventTypeUpdate,
						saveRow: handleSave,
						cancelEdit: handleCancel,
						validationErrors,
					}}
				/>
			)}

			{eventTypeToDelete && (
				<ConfirmationDialog
					open={openConfirmDialog}
					onClose={handleCancelDelete}
					onConfirm={handleConfirmDelete}
					title="Confirmar Eliminación"
					description={`¿Estás seguro de que deseas eliminar el tipo de evento "${eventTypeToDelete.name}"? Esta acción no se puede deshacer.`}
				/>
			)}
		</Box>
	);
};

export default Page;
