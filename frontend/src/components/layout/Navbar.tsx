import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Stack,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const Navbar = () => {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" noWrap sx={{ flexGrow: 1 }}>
          App
        </Typography>
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          <Stack direction="row" spacing={2}>
            <Button color="inherit" component={Link} href="/">
              Inicio
            </Button>
            <Button color="inherit" component={Link} href="/people">
              Personas
            </Button>
            <Button color="inherit" component={Link} href="/group">
              Grupos
            </Button>
            <Button color="inherit" component={Link} href="/events">
              Eventos
            </Button>
            <Button color="inherit" component={Link} href="/responsibility">
              Responsibility
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              component={Link}
              href="/auth/login"
            >
              Login
            </Button>
          </Stack>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
