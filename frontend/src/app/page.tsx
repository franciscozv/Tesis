"use client";
import { Container, Typography } from "@mui/material";
import EventCharts from "../components/features/event/EventCharts";

export default function HomePage() {
	return (
		<Container maxWidth="lg">
			<Typography variant="h4" component="h1" gutterBottom>
				Dashboard
			</Typography>
			<EventCharts />
		</Container>
	);
}