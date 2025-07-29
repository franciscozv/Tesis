"use client";
import { IconButton, Tooltip } from "@mui/material";
import { Settings } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface PlanningButtonProps {
	eventId: number;
	eventState: string;
	size?: "small" | "medium" | "large";
	color?: "primary" | "secondary" | "default";
	title?: string;
}

const PlanningButton = ({ 
	eventId, 
	eventState,
	size = "medium", 
	color = "primary",
	title = "Planificar evento"
}: PlanningButtonProps) => {
	const router = useRouter();

	const handlePlanningClick = () => {
		router.push(`/planning?eventId=${eventId}`);
	};

	// Solo mostrar el botón si el evento está aprobado
	if (eventState !== "APPROVED") {
		return null;
	}

	return (
		<Tooltip title={title} arrow>
			<IconButton
				color={color}
				size={size}
				onClick={handlePlanningClick}
				sx={{
					'&:hover': {
						transform: 'scale(1.1)',
						transition: 'transform 0.2s ease-in-out',
					},
				}}
			>
				<Settings />
			</IconButton>
		</Tooltip>
	);
};

export default PlanningButton; 