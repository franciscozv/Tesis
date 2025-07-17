"use client";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Define a modern color palette
const palette = {
  primary: {
    main: "#1976D2", // A deep, professional blue
    light: "#63A4FF",
    dark: "#004BA0",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#FFC107", // A vibrant amber for accents
    light: "#FFF350",
    dark: "#C79100",
    contrastText: "#000000",
  },
  background: {
    default: "#F4F6F8", // A light grey for the background
    paper: "#FFFFFF", // White for paper elements
  },
  text: {
    primary: "#333333",
    secondary: "#555555",
  },
};

// Create the theme instance
let theme = createTheme({
  palette,
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 500,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 500,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // Softer corners for a modern look
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // More readable buttons
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
          },
        },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: {
            color: palette.primary.contrastText,
          },
        },
      ],
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.primary.main,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: palette.background.paper,
          color: palette.text.primary,
          boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          "&::placeholder": {
            color: palette.text.secondary, // Ensure placeholder text is visible
            opacity: 1, // Ensure placeholder is not transparent
          },
        },
      },
    },
  },
});

// Make typography responsive
theme = responsiveFontSizes(theme);

export default theme;