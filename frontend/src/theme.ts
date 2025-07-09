"use client";
import { createTheme } from "@mui/material/styles";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

const theme = createTheme({
  palette: {
    primary: {
      main: "#2196F3", // Un azul más vibrante y clásico
      light: "#64B5F6",
      dark: "#1976D2",
      contrastText: "#fff",
    },
    secondary: {
      main: "#FFC107", // Un ámbar cálido, que sugiere luz y esperanza
      light: "#FFD54F",
      dark: "#FFB300",
      contrastText: "rgba(0, 0, 0, 0.87)",
    },
    // Puedes añadir más colores o ajustar estos según la identidad visual de la iglesia
  },
  typography: {
    fontFamily: roboto.style.fontFamily,
  },
});

export default theme;
