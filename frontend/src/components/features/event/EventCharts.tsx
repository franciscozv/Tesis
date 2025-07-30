'use client';
import { Card, CardContent, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getEvents } from "~/services/eventService";
import { getEventTypes } from "~/services/eventTypeService";

const EventCharts = () => {
	const [eventsByState, setEventsByState] = useState<{ name: string; cantidad: number }[]>([]);
	const [eventsByType, setEventsByType] = useState<{ name: string; cantidad: number }[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			const events = await getEvents();
			const eventTypes = await getEventTypes();

			const stateTranslations: Record<string, string> = {
				approved: "Aprobado",
				rejected: "Rechazado",
				pending: "Pendiente",
			};

			type EventsByStateAccumulator = Record<string, { name: string; cantidad: number }>;

			const eventsByStateData = events.reduce<EventsByStateAccumulator>((acc, event) => {
				const stateKey = event.state.toLowerCase();
				const translatedState = stateTranslations[stateKey] ?? event.state;
				
				const existingEntry = acc[event.state];
				if (!existingEntry) {
					acc[event.state] = { name: translatedState, cantidad: 1 };
				} else {
					existingEntry.cantidad++;
				}
				return acc;
			}, {});
			setEventsByState(Object.values(eventsByStateData));

			type EventsByTypeAccumulator = Record<string, { name: string; cantidad: number }>;

			const eventsByTypeData = events.reduce<EventsByTypeAccumulator>((acc, event) => {
				const eventType = eventTypes.find((et: { id: number }) => et.id === event.eventTypeId);
				const typeName = eventType ? eventType.name : "Unknown";
				
				const existingEntry = acc[typeName];
				if (!existingEntry) {
					acc[typeName] = { name: typeName, cantidad: 1 };
				} else {
					existingEntry.cantidad++;
				}
				return acc;
			}, {});
			setEventsByType(Object.values(eventsByTypeData));
		};

		fetchData();
	}, []);

	return (
		<Grid container spacing={3}>
			<Grid item xs={12} md={6}>
				<Card>
					<CardContent>
						<Typography variant='h6' component='div'>
							Eventos por Estado
						</Typography>
						<ResponsiveContainer width='100%' height={300}>
							<BarChart data={eventsByState}>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='name' />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey='cantidad' fill='#8884d8' />
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</Grid>
			<Grid item xs={12} md={6}>
				<Card>
					<CardContent>
						<Typography variant='h6' component='div'>
							Eventos por Tipo
						</Typography>
						<ResponsiveContainer width='100%' height={300}>
							<PieChart>
								<Pie dataKey='cantidad' data={eventsByType} nameKey='name' cx='50%' cy='50%' outerRadius={80} fill='#82ca9d' label />
								<Tooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</Grid>
		</Grid>
	);
};

export default EventCharts;
