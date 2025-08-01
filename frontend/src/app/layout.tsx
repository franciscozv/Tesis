import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import ThemeRegistry from "../components/ThemeRegistry";
import Navbar from "../components/layout/Navbar";

const roboto = Roboto({
	weight: ["300", "400", "500", "700"],
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Mi App Web",
	description: "Generated by create-t3-app",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={roboto.className}>
			<body>
				<ThemeRegistry>
					<Navbar />
					{children}
				</ThemeRegistry>
			</body>
		</html>
	);
}
