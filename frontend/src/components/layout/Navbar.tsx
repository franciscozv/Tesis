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
import { usePathname } from "next/navigation";
import { useState } from "react";

const Navbar = () => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const theme = useTheme();
	const pathname = usePathname();

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const menuItemStyles = {
		borderRadius: "4px",
		"&:hover": {
			backgroundColor: "#D1CEE8",
		},
	};

	const activeLinkStyles = {
		backgroundColor: "#D1CEE8",
		fontWeight: "bold",
	};

	return (
		<AppBar position="static" elevation={0}>
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
							<MenuItem
								component={Link}
								href="/"
								onClick={handleClose}
								sx={{ ...menuItemStyles, ...(pathname === "/" && activeLinkStyles) }}
							>
								Inicio
							</MenuItem>
							<MenuItem
								component={Link}
								href="/people"
								onClick={handleClose}
								sx={{
									...menuItemStyles,
									...(pathname === "/people" && activeLinkStyles),
								}}
							>
								Personas
							</MenuItem>
							<MenuItem
								component={Link}
								href="/group"
								onClick={handleClose}
								sx={{
									...menuItemStyles,
									...(pathname === "/group" && activeLinkStyles),
								}}
							>
								Grupos
							</MenuItem>
							<MenuItem
								component={Link}
								href="/people-roles"
								onClick={handleClose}
								sx={{
									...menuItemStyles,
									...(pathname === "/people-roles" && activeLinkStyles),
								}}
							>
								Roles de Personas
							</MenuItem>
							<MenuItem
								component={Link}
								href="/events"
								onClick={handleClose}
								sx={{
									...menuItemStyles,
									...(pathname === "/events" && activeLinkStyles),
								}}
							>
								Eventos
							</MenuItem>
							<MenuItem
								component={Link}
								href="/request"
								onClick={handleClose}
								sx={{
									...menuItemStyles,
									...(pathname === "/request" && activeLinkStyles),
								}}
							>
								Planificar
							</MenuItem>
							<MenuItem
								component={Link}
								href="/eventType"
								onClick={handleClose}
								sx={{
									...menuItemStyles,
									...(pathname === "/eventType" && activeLinkStyles),
								}}
							>
								Tipos de Evento
							</MenuItem>
							<MenuItem
								component={Link}
								href="/place"
								onClick={handleClose}
								sx={{
									...menuItemStyles,
									...(pathname === "/place" && activeLinkStyles),
								}}
							>
								Lugares
							</MenuItem>
							<MenuItem
								component={Link}
								href="/responsibility"
								onClick={handleClose}
								sx={{
									...menuItemStyles,
									...(pathname === "/responsibility" && activeLinkStyles),
								}}
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
