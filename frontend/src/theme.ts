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
		main: "#675496",
		contrastText: "#FFFFFF",
	},
	secondary: {
		main: "#98D05A",
		contrastText: "#FFFFFF",
	},
	tertiary: {
		main: "#D05A98",
		contrastText: "#FFFFFF",
	},
	error: {
		main: "#B3261E",
		contrastText: "#FFFFFF",
	},
	background: {
		default: "#FEFBFF",
		paper: "#FEFBFF",
	},
	text: {
		primary: "#333333",
		secondary: "#555555",
	},
	surface: {
		main: "#FEFBFF",
		variant: "#98D05A",
		contrastText: "#333333",
		onVariant: "#FFFFFF",
	},
	outline: {
		main: "#CCCCCC",
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
					backgroundColor: palette.surface.main,
					border: `1px solid ${palette.outline.main}`,
				},
			},
		},
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: "#EBE4EA",
					color: palette.text.primary,
					borderBottom: `1px solid ${palette.outline.main}`,
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					backgroundColor: palette.surface.main,
				},
			},
		},
		MuiMenu: {
			styleOverrides: {
				paper: {
					backgroundColor: "#EBE4EA",
				},
			},
		},
	},
});

theme = responsiveFontSizes(theme);

export default theme;