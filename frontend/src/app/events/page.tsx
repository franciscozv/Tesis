"use client";
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import CreateEventForm from "~/components/features/event/CreateEventForm";
import { UpdateEventFormSchema } from "~/components/features/event/event.validators";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";
import { DataTable } from "~/components/ui/DataTable";
import {
	deleteEvent,
	getEvents,
	updateEvent,
	updateEventStatus,
} from "~/services/eventService";
import { getEventTypes } from "~/services/eventTypeService";
import { getPlaces } from "~/services/placeService";
import { type Event, getColumns } from "./columns";

const Page = () => {
	const [events, setEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingRowId, setEditingRowId] = useState<number | null>(null);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
	const [eventToDelete, setEventToDelete] = useState<{
		id: number;
		title: string;
	} | null>(null);
	const [openStatusDialog, setOpenStatusDialog] = useState(false);
	const [statusAction, setStatusAction] = useState<
		"APPROVED" | "REJECTED" | null
	>(null);
	const [statusEventId, setStatusEventId] = useState<number | null>(null);
	const [statusComment, setStatusComment] = useState("");
	const [stateFilter, setStateFilter] = useState<string[]>([
		"PENDING",
		"APPROVED",
		"REJECTED",
	]);

	const handleStateFilterChange = (value: string) => {
		let newFilter: string[];
		if (value === "ALL") {
			if (stateFilter.length === 3) {
				newFilter = [];
			} else {
				newFilter = ["PENDING", "APPROVED", "REJECTED"];
			}
		} else {
			if (stateFilter.includes(value)) {
				newFilter = stateFilter.filter((v) => v !== value);
			} else {
				newFilter = [...stateFilter, value];
			}
		}
		setStateFilter(newFilter);
	};

	const [places, setPlaces] = useState<any[]>([]);
	const [eventTypes, setEventTypes] = useState<any[]>([]);

	const fetchData = async () => {
		if (events.length === 0) {
			setLoading(true);
		}
		try {
			const [eventsData, placesData, eventTypesData] = await Promise.all([
				getEvents(),
				getPlaces(), // Asumiendo que tienes un servicio getPlaces
				getEventTypes(), // Asumiendo que tienes un servicio getEventTypes
			]);
			setEvents(eventsData || []);
			setPlaces(placesData || []);
			setEventTypes(eventTypesData || []);
		} catch (error) {
			console.error("Error al obtener datos:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleDelete = (id: number, title: string) => {
		setEventToDelete({ id, title });
		setOpenConfirmDialog(true);
	};

	const handleConfirmDelete = async () => {
		if (eventToDelete) {
			try {
				await deleteEvent(eventToDelete.id);
				fetchData(); // Refrescar datos
			} catch (error) {
				console.error("Error al eliminar el evento:", error);
				alert("Error al eliminar el evento");
			} finally {
				setOpenConfirmDialog(false);
				setEventToDelete(null);
			}
		}
	};

	const handleCancelDelete = () => {
		setOpenConfirmDialog(false);
		setEventToDelete(null);
	};

	const handleEventUpdate = (
		rowIndex: number,
		columnId: string,
		value: any,
	) => {
		setEvents((old) =>
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

	const handleSave = async (eventId: number) => {
		const eventToUpdate = events.find((e) => e.id === eventId);
		if (eventToUpdate) {
			const validationResult = UpdateEventFormSchema.safeParse(eventToUpdate);
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
			const dataToUpdate = {
				...validationResult.data,
				startDateTime: validationResult.data.startDateTime ? new Date(validationResult.data.startDateTime).toISOString() : undefined,
				endDateTime: validationResult.data.endDateTime ? new Date(validationResult.data.endDateTime).toISOString() : undefined,
			};
			try {
				await updateEvent(eventId, dataToUpdate);
				setEditingRowId(null); // Salir del modo edición
			} catch (error) {
				console.error("Error al actualizar el evento:", error);
				alert("Error al actualizar el evento");
				fetchData(); // Revertir cambios si falla la API
			}
		}
	};

	const handleCancel = () => {
		setEditingRowId(null);
		setValidationErrors({}); // Limpiar errores al cancelar
		fetchData(); // Recargar datos originales
	};

	const handleOpenStatusDialog = (
		id: number,
		action: "APPROVED" | "REJECTED",
	) => {
		setStatusEventId(id);
		setStatusAction(action);
		setStatusComment("");
		setOpenStatusDialog(true);
	};

	const handleCloseStatusDialog = () => {
		setOpenStatusDialog(false);
		setStatusEventId(null);
		setStatusAction(null);
		setStatusComment("");
	};

	const handleConfirmStatus = async () => {
		if (statusEventId && statusAction) {
			try {
				const updatedEvent = await updateEventStatus(
					statusEventId,
					statusAction,
					statusComment,
				);
				setEvents((prevEvents) =>
					prevEvents.map((event) =>
						event.id === statusEventId
							? { ...event, ...updatedEvent.responseObject }
							: event,
					),
				);
			} catch (error) {
				console.error("Error al actualizar estado del evento:", error);
			} finally {
				handleCloseStatusDialog();
			}
		}
	};

	const columns = useMemo(
		() => getColumns(handleDelete, handleOpenStatusDialog),
		[handleDelete, handleOpenStatusDialog],
	);

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Eventos
			</Typography>
			<Box sx={{ mb: 4 }}>
				<CreateEventForm refreshEvents={fetchData} />
			</Box>

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
					<CircularProgress />
					<Typography variant="body1" sx={{ ml: 2 }}>
						Cargando eventos...
					</Typography>
				</Box>
			) : (
				<DataTable
					columns={columns}
					data={events}
					meta={{
						editingRowId,
						setEditingRowId,
						updateData: handleEventUpdate,
						saveRow: handleSave,
						cancelEdit: handleCancel,
						validationErrors,
						places,
						eventTypes,
					}}
					enableStateFilter
					stateFilter={stateFilter}
					onStateFilterChange={handleStateFilterChange}
				/>
			)}

			{eventToDelete && (
				<ConfirmationDialog
					open={openConfirmDialog}
					onClose={handleCancelDelete}
					onConfirm={handleConfirmDelete}
					title="Confirmar Eliminación"
					description={`¿Estás seguro de que deseas eliminar el evento "${eventToDelete.title}"? Esta acción no se puede deshacer.`}
				/>
			)}

			<Dialog
				open={openStatusDialog}
				onClose={handleCloseStatusDialog}
				fullWidth
				maxWidth="sm"
			>
				<DialogTitle variant="h5">
					{statusAction === "APPROVED" ? "Aprobar Evento" : "Rechazar Evento"}
				</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 2 }}>
						{statusAction === "APPROVED"
							? "Para aprobar el evento, por favor, añade un comentario a continuación."
							: "Para rechazar el evento, por favor, proporciona un motivo en el campo de comentarios."}
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						label="Comentario"
						type="text"
						fullWidth
						multiline
						minRows={3}
						value={statusComment}
						onChange={(e) => setStatusComment(e.target.value)}
						placeholder={
							statusAction === "APPROVED"
								? "Ej: Todo parece correcto."
								: "Ej: Faltan detalles en la descripción."
						}
						variant="outlined"
					/>
				</DialogContent>
				<DialogActions sx={{ p: "16px 24px" }}>
					<Button
						onClick={handleCloseStatusDialog}
						color="secondary"
						variant="outlined"
					>
						Cancelar
					</Button>
					<Button
						onClick={handleConfirmStatus}
						color={statusAction === "APPROVED" ? "success" : "error"}
						variant="contained"
						sx={{ ml: 2 }}
					>
						{statusAction === "APPROVED"
							? "Confirmar Aprobación"
							: "Confirmar Rechazo"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default Page;