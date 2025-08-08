"use client";
import { Container, Typography } from "@mui/material";
import EventCharts from "../components/features/event/EventCharts";
import MembersByGroupChart from "../components/features/dashboard/MembersByGroupChart";

export default function HomePage() {
	return (
		<Container maxWidth="lg">
			<Typography variant="h4" component="h1" gutterBottom>
				Dashboard
			</Typography>
			<EventCharts />
			<div style={{marginTop: "2rem"}}>
			<MembersByGroupChart />

			</div>
		</Container>
	);
}