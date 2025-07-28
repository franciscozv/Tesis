import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from "@mui/material";
import type React from "react";

type ConfirmationDialogProps = {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	description: string;
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
	open,
	onClose,
	onConfirm,
	title,
	description,
}) => {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			aria-labelledby="confirmation-dialog-title"
			aria-describedby="confirmation-dialog-description"
		>
			<DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
			<DialogContent>
				<DialogContentText id="confirmation-dialog-description">
					{description}
				</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="primary">
					Cancelar
				</Button>
				<Button onClick={onConfirm} color="error" autoFocus>
					Confirmar
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default ConfirmationDialog;
