'use client';
import { Card, CardContent, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getEvents } from "~/services/eventService";
import { getEventTypes } from "~/services/eventTypeService";

const EventCharts = () => {
	const [eventsByState, setEventsByState] = useState([]);
	const [eventsByType, setEventsByType] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			const events = await getEvents();
			const eventTypes = await getEventTypes();

			const stateTranslations = {
				approved: "Aprobado",
				rejected: "Rechazado",
				pending: "Pendiente",
			};

			const eventsByStateData = events.reduce((acc, event) => {
				const stateKey = event.state.toLowerCase();
				const translatedState = stateTranslations[stateKey] || event.state;
				if (!acc[event.state]) {
					acc[event.state] = { name: translatedState, cantidad: 0 };
				}
				acc[event.state].cantidad++;
				return acc;
			}, {});
			setEventsByState(Object.values(eventsByStateData));

			const eventsByTypeData = events.reduce((acc, event) => {
				const eventType = eventTypes.find(et => et.id === event.eventTypeId);
				const typeName = eventType ? eventType.name : "Unknown";
				if (!acc[typeName]) {
					acc[typeName] = { name: typeName, cantidad: 0 };
				}
				acc[typeName].cantidad++;
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
