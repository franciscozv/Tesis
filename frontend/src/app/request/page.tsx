"use client";
import {
	Box,
	Typography,
	Card,
	CardContent,
	CardHeader,
	Grid,
	Button,
	IconButton,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	Chip,
} from "@mui/material";
import { Settings, Add, CalendarMonth } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { getEvents } from "~/services/eventService";
import PlanningButton from "~/components/features/event/PlanningButton";
import EventInfoDialog from "~/components/features/event/EventInfoDialog";
import type { Event } from "~/services/eventService";
import { getContrastColor, getStateColors } from "~/utils/themeColors";

const RequestPage = () => {
	const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	useEffect(() => {
		const fetchEvents = async () => {
			try {
				const events = await getEvents();
				// Filtrar solo eventos aprobados
				const approved = events.filter(event => event.state === "APPROVED");
				setApprovedEvents(approved);
			} catch (error) {
				console.error("Error al cargar eventos:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchEvents();
	}, []);

	const handleEventClick = (event: Event) => {
		setSelectedEvent(event);
		setDialogOpen(true);
	};

	const handleDialogClose = () => {
		setDialogOpen(false);
		setSelectedEvent(null);
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Planificar Eventos
			</Typography>
			<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
				Gestiona la planificación de eventos aprobados
			</Typography>

			<Grid container spacing={3}>
				{/* Tarjeta de Eventos Aprobados */}
				<Grid item xs={12}>
					<Card>
						<CardHeader
							title="Eventos Aprobados para Planificar"
							subtitle="Eventos que han sido aprobados y están listos para planificar"
							action={
								<IconButton>
									<CalendarMonth />
								</IconButton>
							}
						/>
						<CardContent>
							{loading ? (
								<Typography>Cargando eventos...</Typography>
							) : approvedEvents.length === 0 ? (
								<Box sx={{ textAlign: 'center', py: 3 }}>
									<Typography variant="body2" color="text.secondary" gutterBottom>
										No hay eventos aprobados para planificar
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
										Los eventos deben ser aprobados antes de poder planificarlos
									</Typography>
									<Button
										variant="outlined"
										startIcon={<Add />}
										href="/events"
									>
										Ver todos los eventos
									</Button>
								</Box>
							) : (
								<List>
									{approvedEvents.map((event) => (
										<ListItem
											key={event.id}
											sx={{
												border: '1px solid',
												borderColor: 'divider',
												borderRadius: 1,
												mb: 1,
												cursor: 'pointer',
												'&:hover': {
													backgroundColor: 'action.hover',
												},
											}}
											onClick={() => handleEventClick(event)}
										>
											<ListItemText
												primary={event.title}
												secondary={
													<Box>
														<Typography variant="body2" color="text.secondary">
															{event.description}
														</Typography>
														<Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
															<Chip
																label={event.location}
																size="small"
																variant="outlined"
															/>
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
														</Box>
													</Box>
												}
											/>
											<ListItemSecondaryAction>
												<PlanningButton 
													eventId={event.id} 
													eventState={event.state}
													size="small"
													title="Planificar este evento"
												/>
											</ListItemSecondaryAction>
										</ListItem>
									))}
								</List>
							)}
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Diálogo de información del evento */}
			<EventInfoDialog
				open={dialogOpen}
				event={selectedEvent}
				onClose={handleDialogClose}
			/>
		</Box>
	);
};

export default RequestPage; 