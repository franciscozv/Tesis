import { type ButtonProps, Button as MuiButton } from "@mui/material";

const Button = (props: ButtonProps) => {
	return <MuiButton {...props} />;
};

export default Button;
