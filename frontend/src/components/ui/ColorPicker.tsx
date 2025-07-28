import { Box, Grid, Paper, Typography } from "@mui/material";
import type React from "react";

interface ColorPickerProps {
	selectedColor: string;
	onColorChange: (color: string) => void;
}

const colors = [
	"#e67c73",
	"#f7cb73",
	"#f4511e",
	"#d96666",
	"#b39ddb",
	"#7986cb",
	"#8e24aa",
	"#616161",
	"#a79b8e",
	"#039be5",
	"#009688",
	"#4285f4",
	"#33b679",
	"#b3dc6c",
	"#f6bf26",
	"#f4b400",
	"#7bd148",
	"#d50000",
];

const ColorPicker: React.FC<ColorPickerProps> = ({
	selectedColor,
	onColorChange,
}) => {
	return (
		<Box>
			<Typography variant="subtitle1" gutterBottom>
				Color
			</Typography>
			<Grid container spacing={1}>
				{colors.map((color) => (
					<Grid item key={color}>
						<Paper
							sx={{
								backgroundColor: color,
								width: 30,
								height: 30,
								cursor: "pointer",
								border: selectedColor === color ? "2px solid #000" : "none",
								borderRadius: "50%",
							}}
							onClick={() => onColorChange(color)}
						/>
					</Grid>
				))}
			</Grid>
		</Box>
	);
};

export default ColorPicker;
