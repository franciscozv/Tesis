"use client";
import {
	Box,
	Typography,
	Card,
	CardContent,
	Paper,
	Breadcrumbs,
	Link,
	Chip,
	CircularProgress,
	Alert,
	Grid,
	AppBar,
	Toolbar,
	Tabs,
	Tab,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Settings, CalendarMonth, LocationOn, Category, Schedule } from "@mui/icons-material";
import { getEventById } from "~/services/eventService";
import type { Event } from "~/services/eventService";

// Componente para la pestaña de Participantes
const ParticipantsTab = ({ event }: { event: Event }) => {
	return (
		<Card sx={{ mt: 2 }}>
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Participantes del Evento
				</Typography>
				<Typography variant="body1" color="text.secondary" paragraph>
					Gestiona los participantes y asistentes del evento.
				</Typography>
				
				{/* Contenido de participantes */}
				<Box sx={{ mt: 2 }}>
					<Typography variant="subtitle1" gutterBottom>
						Lista de Participantes:
					</Typography>
					<ul>
						<li>Participante 1: [Pendiente de agregar]</li>
						<li>Participante 2: [Pendiente de agregar]</li>
						<li>Participante 3: [Pendiente de agregar]</li>
					</ul>
				</Box>
			</CardContent>
		</Card>
	);
};

// Componente para la pestaña de Parafernalia
const ParafernaliaTab = ({ event }: { event: Event }) => {
	return (
		<Card sx={{ mt: 2 }}>
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Parafernalia del Evento
				</Typography>
				<Typography variant="body1" color="text.secondary" paragraph>
					Gestiona los materiales, equipos y elementos necesarios para el evento.
				</Typography>
				
				{/* Contenido de parafernalia */}
				<Box sx={{ mt: 2 }}>
					<Typography variant="subtitle1" gutterBottom>
						Materiales y Equipos:
					</Typography>
					<ul>
						<li>Material 1: [Pendiente de definir]</li>
						<li>Material 2: [Pendiente de definir]</li>
						<li>Material 3: [Pendiente de definir]</li>
					</ul>
				</Box>
			</CardContent>
		</Card>
	);
};

// Componente para la pestaña de Necesidades
const NeedsTab = ({ event }: { event: Event }) => {
	return (
		<Card sx={{ mt: 2 }}>
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Necesidades del Evento
				</Typography>
				<Typography variant="body1" color="text.secondary" paragraph>
					Identifica y gestiona las necesidades específicas para la realización del evento.
				</Typography>
				
				{/* Contenido de necesidades */}
				<Box sx={{ mt: 2 }}>
					<Typography variant="subtitle1" gutterBottom>
						Necesidades Identificadas:
					</Typography>
					<ul>
						<li>Necesidad 1: [Pendiente de definir]</li>
						<li>Necesidad 2: [Pendiente de definir]</li>
						<li>Necesidad 3: [Pendiente de definir]</li>
					</ul>
				</Box>
			</CardContent>
		</Card>
	);
};

// Componente para la pestaña de Objetivos
const ObjectivesTab = ({ event }: { event: Event }) => {
	return (
		<Card sx={{ mt: 2 }}>
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Objetivos del Evento
				</Typography>
				<Typography variant="body1" color="text.secondary" paragraph>
					Define los objetivos principales que se quieren alcanzar con este evento.
				</Typography>
				
				{/* Contenido de objetivos */}
				<Box sx={{ mt: 2 }}>
					<Typography variant="subtitle1" gutterBottom>
						Objetivos Principales:
					</Typography>
					<ul>
						<li>Objetivo 1: [Pendiente de definir]</li>
						<li>Objetivo 2: [Pendiente de definir]</li>
						<li>Objetivo 3: [Pendiente de definir]</li>
					</ul>
				</Box>
			</CardContent>
		</Card>
	);
};

// Componente para la pestaña de Obstáculos
const ObstaclesTab = ({ event }: { event: Event }) => {
	return (
		<Card sx={{ mt: 2 }}>
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Obstáculos y Riesgos
				</Typography>
				<Typography variant="body1" color="text.secondary" paragraph>
					Identifica los posibles obstáculos y riesgos para la realización del evento.
				</Typography>
				
				{/* Contenido de obstáculos */}
				<Box sx={{ mt: 2 }}>
					<Typography variant="subtitle1" gutterBottom>
						Obstáculos Identificados:
					</Typography>
					<ul>
						<li>Obstáculo 1: [Pendiente de identificar]</li>
						<li>Obstáculo 2: [Pendiente de identificar]</li>
						<li>Obstáculo 3: [Pendiente de identificar]</li>
					</ul>
				</Box>
			</CardContent>
		</Card>
	);
};

// Componente principal de la página de planificación
const PlanningPage = () => {
	const searchParams = useSearchParams();
	const eventId = searchParams.get('eventId') || '';
	const [activeTab, setActiveTab] = useState(0);
	const [event, setEvent] = useState<Event | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchEvent = async () => {
			if (!eventId) {
				setError("No se especificó un ID de evento");
				setLoading(false);
				return;
			}

			try {
				const eventData = await getEventById(parseInt(eventId));
				setEvent(eventData);
			} catch (err) {
				setError("Error al cargar la información del evento");
				console.error("Error fetching event:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchEvent();
	}, [eventId]);

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	// Definir las pestañas disponibles
	const tabs = [
		{ label: "Participantes", component: event && <ParticipantsTab event={event} /> },
		{ label: "Parafernalia", component: event && <ParafernaliaTab event={event} /> },
		{ label: "Necesidades", component: event && <NeedsTab event={event} /> },
		{ label: "Objetivos", component: event && <ObjectivesTab event={event} /> },
		{ label: "Obstáculos", component: event && <ObstaclesTab event={event} /> },
	];

	if (loading) {
		return (
			<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !event) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error" sx={{ mb: 3 }}>
					{error || "No se pudo cargar la información del evento"}
				</Alert>
				<Link href="/events" color="primary">
					Volver a la lista de eventos
				</Link>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			{/* Breadcrumbs */}
			<Breadcrumbs sx={{ mb: 3 }}>
				<Link href="/" color="inherit" underline="hover">
					Inicio
				</Link>
				<Link href="/events" color="inherit" underline="hover">
					Eventos
				</Link>
				<Typography color="text.primary">Planificación</Typography>
			</Breadcrumbs>

			{/* Header con información del evento */}
			<Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, gap: 3 }}>
				<Settings sx={{ fontSize: 32, color: 'primary.main', mt: 1 }} />
				<Box sx={{ flex: 1 }}>
					<Typography variant="h4" component="h1" gutterBottom>
						Planificación del Evento
					</Typography>
					<Typography variant="h5" color="text.secondary" gutterBottom>
						{event.title}
					</Typography>
					
					{/* Información detallada del evento */}
					<Box sx={{ 
						mt: 2, 
						p: 2, 
						backgroundColor: 'grey.50', 
						borderRadius: 2,
						border: '1px solid',
						borderColor: 'divider'
					}}>
						<Grid container spacing={2}>
							<Grid item xs={12} md={6}>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
									<Typography variant="subtitle2" color="text.secondary">
										<strong>Descripción:</strong>
									</Typography>
									<Typography variant="body2" sx={{ mb: 1 }}>
										{event.description}
									</Typography>
									
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<LocationOn fontSize="small" color="action" />
										<Typography variant="body2">
											<strong>Ubicación:</strong> {event.location}
										</Typography>
									</Box>
									
									{event.eventType && (
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											<Category fontSize="small" color="action" />
											<Typography variant="body2">
												<strong>Tipo:</strong> 
												<Chip
													label={event.eventType.name}
													size="small"
													sx={{
														ml: 1,
														backgroundColor: event.eventType.color,
														color: 'white',
														fontWeight: 'bold',
													}}
												/>
											</Typography>
										</Box>
									)}
								</Box>
							</Grid>
							
							<Grid item xs={12} md={6}>
								<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Schedule fontSize="small" color="action" />
										<Typography variant="body2">
											<strong>Fecha de Inicio:</strong>
										</Typography>
									</Box>
									<Typography variant="body2" sx={{ ml: 2, mb: 1 }}>
										{new Date(event.startDateTime).toLocaleString('es-ES', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										})}
									</Typography>
									
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Schedule fontSize="small" color="action" />
										<Typography variant="body2">
											<strong>Fecha de Fin:</strong>
										</Typography>
									</Box>
									<Typography variant="body2" sx={{ ml: 2, mb: 1 }}>
										{new Date(event.endDateTime).toLocaleString('es-ES', {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										})}
									</Typography>
									
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Category fontSize="small" color="action" />
										<Typography variant="body2">
											<strong>Estado:</strong> 
											<Chip
												label={
													event.state === "PENDING" ? "Pendiente" :
													event.state === "APPROVED" ? "Aprobado" :
													"Rechazado"
												}
												size="small"
												color={
													event.state === "PENDING" ? "warning" :
													event.state === "APPROVED" ? "success" :
													"error"
												}
												sx={{ ml: 1 }}
											/>
										</Typography>
									</Box>
								</Box>
							</Grid>
						</Grid>
					</Box>
				</Box>
			</Box>

			{/* Pestañas */}
			<Paper sx={{ width: '100%', mb: 2 }}>
				<AppBar position="static" color="default" elevation={1}>
					<Toolbar sx={{ minHeight: 'auto' }}>
						<Tabs
							value={activeTab}
							onChange={handleTabChange}
							indicatorColor="primary"
							textColor="primary"
							variant="scrollable"
							scrollButtons="auto"
							sx={{ flexGrow: 1 }}
						>
							{tabs.map((tab, index) => (
								<Tab key={index} label={tab.label} />
							))}
						</Tabs>
					</Toolbar>
				</AppBar>
			</Paper>

			{/* Contenido de la pestaña activa */}
			<Box sx={{ mt: 2 }}>
				{tabs[activeTab]?.component}
			</Box>
		</Box>
	);
};

export default PlanningPage; 