'use client';
import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Box sx={{ flexGrow: 0 }}>
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
            <MenuItem component={Link} href="/eventType" onClick={handleClose}>
              Tipos de Evento
            </MenuItem>
            <MenuItem component={Link} href="/responsibility" onClick={handleClose}>
              Responsabilidades
            </MenuItem>
          </Menu>
        </Box>
        <Button
          color="inherit"
          variant="outlined"
          component={Link}
          href="/auth/login"
        >
          Login
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
