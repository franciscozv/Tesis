"use client";
import MenuIcon from "@mui/icons-material/Menu";
import {
	AppBar,
	Box,
	Button,
	Container,
	IconButton,
	Menu,
	MenuItem,
	Toolbar,
	Typography,
	useTheme,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

const Navbar = () => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const theme = useTheme();

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<AppBar
			position="static"
			elevation={0}
			sx={{ backgroundColor: theme.palette.background.paper }}
		>
			<Container maxWidth="xl">
				<Toolbar disableGutters>
					<Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
						<IconButton
							size="large"
							edge="start"
							color="inherit"
							aria-label="menu"
							onClick={handleClick}
							sx={{ mr: 2 }}
						>
							<MenuIcon />
						</IconButton>
						<Menu
							id="menu-appbar"
							anchorEl={anchorEl}
							anchorOrigin={{
								vertical: "bottom",
								horizontal: "left",
							}}
							keepMounted
							transformOrigin={{
								vertical: "top",
								horizontal: "left",
							}}
							open={open}
							onClose={handleClose}
						>
							<MenuItem component={Link} href="/" onClick={handleClose}>
								Inicio
							</MenuItem>
							<MenuItem component={Link} href="/people" onClick={handleClose}>
								Personas
							</MenuItem>
							<MenuItem component={Link} href="/group" onClick={handleClose}>
								Grupos
							</MenuItem>
							<MenuItem component={Link} href="/events" onClick={handleClose}>
								Eventos
							</MenuItem>
							<MenuItem
								component={Link}
								href="/eventType"
								onClick={handleClose}
							>
								Tipos de Evento
							</MenuItem>
							<MenuItem
								component={Link}
								href="/responsibility"
								onClick={handleClose}
							>
								Responsabilidades
							</MenuItem>
						</Menu>
					</Box>

					<Box sx={{ flexGrow: 0 }}>
						<Button
							color="primary"
							variant="contained"
							component={Link}
							href="/auth/login"
							sx={{ boxShadow: theme.shadows[1] }}
						>
							Login
						</Button>
					</Box>
				</Toolbar>
			</Container>
		</AppBar>
	);
};

export default Navbar;
