"use client";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Typography,
	Box,
	Chip,
	Divider,
} from "@mui/material";
import { Settings, LocationOn, Category, Schedule } from "@mui/icons-material";
import PlanningButton from "./PlanningButton";
import type { Event } from "~/services/eventService";
import { getContrastColor, getStateColors } from "~/utils/themeColors";

interface EventInfoDialogProps {
	open: boolean;
	event: Event | null;
	onClose: () => void;
}

const EventInfoDialog = ({ open, event, onClose }: EventInfoDialogProps) => {
	if (!event) return null;

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Typography variant="h6" gutterBottom>
					{event.title}
				</Typography>
				{event.eventType && (
					<Chip
						label={event.eventType.name}
						size="small"
						sx={{
							backgroundColor: event.eventType.color,
							color: getContrastColor(event.eventType.color),
							fontWeight: 'bold',
							borderRadius: '8px',
						}}
					/>
				)}
			</DialogTitle>
			<DialogContent>
				<Box sx={{ mb: 2 }}>
					<Typography variant="body1" paragraph>
						{event.description}
					</Typography>
				</Box>

				<Divider sx={{ my: 2 }} />

				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<LocationOn fontSize="small" color="action" />
						<Typography variant="body2">
							<strong>Ubicación:</strong> {event.location}
						</Typography>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Schedule fontSize="small" color="action" />
						<Typography variant="body2">
							<strong>Inicio:</strong> {formatDate(event.startDateTime)}
						</Typography>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Schedule fontSize="small" color="action" />
						<Typography variant="body2">
							<strong>Fin:</strong> {formatDate(event.endDateTime)}
						</Typography>
					</Box>

					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Category fontSize="small" color="action" />
						<Typography variant="body2">
							<strong>Estado:</strong> 
							<Chip
								label={
									event.state === "PENDING" ? "Pendiente" :
									event.state === "APPROVED" ? "Aprobado" :
									event.state === "REJECTED" ? "Rechazado" :
									event.state === "CANCELLED" ? "Cancelado" :
									event.state
								}
								size="small"
								sx={{ 
									ml: 1,
									backgroundColor: getStateColors[event.state as keyof typeof getStateColors]?.backgroundColor || '#EAE2D0',
									color: getStateColors[event.state as keyof typeof getStateColors]?.color || '#4B4739',
									fontWeight: 'bold',
									borderRadius: '8px',
								}}
							/>
						</Typography>
					</Box>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="inherit">
					Cerrar
				</Button>
				{event.state === "APPROVED" && (
					<PlanningButton 
						eventId={event.id} 
						eventState={event.state}
						title="Planificar este evento"
					/>
				)}
			</DialogActions>
		</Dialog>
	);
};

export default EventInfoDialog; 