import { Box, Button, Typography } from "@mui/material";

export default function HomePage() {
	return (
		<Box sx={{ p: 4 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Página de Inicio
			</Typography>
			<Button variant="contained" color="primary">
				Hola, Material UI
			</Button>
		</Box>
	);
}
