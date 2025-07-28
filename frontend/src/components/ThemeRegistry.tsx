"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type * as React from "react";
import theme from "~/theme";
import NextAppDirEmotionCacheProvider from "./EmotionCache";

export default function ThemeRegistry({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<NextAppDirEmotionCacheProvider options={{ key: "mui" }}>
			<ThemeProvider theme={theme}>
				<LocalizationProvider dateAdapter={AdapterDayjs}>
					{/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
					<CssBaseline />
					{children}
				</LocalizationProvider>
			</ThemeProvider>
		</NextAppDirEmotionCacheProvider>
	);
}
