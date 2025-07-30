"use client";
import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import { Roboto } from "next/font/google";

const roboto = Roboto({
	weight: ["300", "400", "500", "700"],
	subsets: ["latin"],
	display: "swap",
});

const palette = {
	primary: {
		main: "#6D5E0F",
		light: "#F8E287",
		dark: "#534600",
		contrastText: "#FFFFFF",
	},
	secondary: {
		main: "#665E40",
		light: "#EEE2BC",
		dark: "#4E472A",
		contrastText: "#FFFFFF",
	},
	tertiary: {
		main: "#43664E",
		light: "#C5ECCE",
		dark: "#2C4E38",
		contrastText: "#FFFFFF",
	},
	error: {
		main: "#BA1A1A",
		light: "#FFDAD6",
		dark: "#93000A",
		contrastText: "#FFFFFF",
	},
	background: {
		default: "#FFF9EE",
		paper: "#FFF9EE",
	},
	surface: {
		default: "#FFF9EE",
		paper: "#FFF9EE",
	},
	text: {
		primary: "#1E1B13",
		secondary: "#4B4739",
	},
	surfaceVariant: {
		main: "#EAE2D0",
		contrastText: "#4B4739",
	},
	outline: {
		main: "#7C7767",
		variant: "#CDC6B4",
	},
	// Colores adicionales del Material Theme Builder
	success: {
		main: "#43664E",
		light: "#C5ECCE",
		dark: "#2C4E38",
		contrastText: "#FFFFFF",
	},
	warning: {
		main: "#665E40",
		light: "#EEE2BC",
		dark: "#4E472A",
		contrastText: "#FFFFFF",
	},
	info: {
		main: "#6D5E0F",
		light: "#F8E287",
		dark: "#534600",
		contrastText: "#FFFFFF",
	},
};

let theme = createTheme({
	palette,
	typography: {
		fontFamily: roboto.style.fontFamily,
	},
	shape: {
		borderRadius: 16,
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					boxShadow: "none",
					"&:hover": {
						boxShadow: "none",
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
		MuiChip: {
			styleOverrides: {
				root: {
					fontWeight: "bold",
				},
			},
		},
		MuiCard: {
			styleOverrides: {
				root: {
					backgroundColor: "#FFF9EE",
					border: "1px solid #CDC6B4",
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: "#FFF9EE",
					color: "#1E1B13",
					borderBottom: "1px solid #CDC6B4",
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundColor: "#FFF9EE",
				},
			},
		},
	},
});

theme = responsiveFontSizes(theme);

export default theme;