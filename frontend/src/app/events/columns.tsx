"use client";
import { Check, Close, Delete, Edit } from "@mui/icons-material";
import {
	Button,
	Checkbox,
	Chip,
	FormControl,
	FormControlLabel,
	FormHelperText,
	IconButton,
	Input,
	Menu,
	MenuItem,
	Select,
	Tooltip,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import type { ColumnDef } from "@tanstack/react-table";
import type { Column, Row, Table } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useState } from "react";

export type Event = {
	id: number;
	title: string;
	description: string;
	startDateTime: string;
	endDateTime: string;
	location: string;
	state: string;
	reviewComment?: string;
};

// Componente para celdas de texto editables
const TextCell = ({
	getValue,
	row,
	column,
	table,
}: {
	getValue: () => any;
	row: Row<any>;
	column: Column<any>;
	table: Table<any>;
}) => {
	const initialValue = getValue();
	const isEditing = table.options.meta?.editingRowId === row.original.id;
	const error = table.options.meta?.validationErrors?.[column.id];

	return isEditing ? (
		<FormControl error={!!error} style={{ width: "100%" }}>
			<Input
				defaultValue={initialValue}
				onChange={(e) =>
					table.options.meta?.updateData?.(row.index, column.id, e.target.value)
				}
				style={{ width: "100%" }}
			/>
			{error && <FormHelperText>{error}</FormHelperText>}
		</FormControl>
	) : (
		<span>{initialValue}</span>
	);
};

// Componente para celdas de fecha y hora editables
const DateTimeCell = ({
	getValue,
	row,
	column,
	table,
}: {
	getValue: () => any;
	row: Row<any>;
	column: Column<any>;
	table: Table<any>;
}) => {
	const initialValue = getValue();
	const isEditing = table.options.meta?.editingRowId === row.original.id;
	const error = table.options.meta?.validationErrors?.[column.id];
	const isStartDate = column.id === "startDateTime";

	const toDisplayDate = (dateString: string) => {
		if (!dateString) return "N/A";
		const date = dayjs(dateString);
		if (!date.isValid()) return "N/A";
		return date.format("DD/MM/YYYY HH:mm");
	};

	return isEditing ? (
		<FormControl error={!!error} style={{ width: "100%" }}>
			<DateTimePicker
				value={initialValue ? dayjs(initialValue) : null}
				onChange={(newValue) => {
					table.options.meta?.updateData?.(
						row.index,
						column.id,
						newValue ? newValue.toISOString() : null,
					);
				}}
				minDate={isStartDate ? dayjs() : dayjs(row.original.startDateTime)}
				format="DD/MM/YYYY HH:mm"
				slotProps={{
					textField: {
						variant: "standard",
						fullWidth: true,
						error: !!error,
						helperText: error,
					},
				}}
			/>
		</FormControl>
	) : (
		<span>{toDisplayDate(initialValue)}</span>
	);
};

export const getColumns = (
	onDelete: (id: number, name: string) => void,
	onOpenStatusDialog: (id: number, action: "APPROVED" | "REJECTED") => void,
): ColumnDef<Event>[] => [
	{
		accessorKey: "title",
		header: "Título",
		cell: TextCell,
		size: 200,
	},
	{
		accessorKey: "description",
		header: "Descripción",
		cell: TextCell,
		size: 300,
	},
	{
		accessorKey: "startDateTime",
		header: "Fecha de Inicio",
		cell: DateTimeCell,
		size: 200,
	},
	{
		accessorKey: "endDateTime",
		header: "Fecha de Fin",
		cell: DateTimeCell,
		size: 200,
	},
	{
		accessorKey: "location",
		header: "Ubicación",
		cell: TextCell,
		size: 200,
	},
	{
		accessorKey: "state",
		header: "Estado",
		filterFn: (row, columnId, filterValue) => {
			if (!filterValue || filterValue.length === 0) return false;
			return filterValue.includes(row.getValue(columnId));
		},
		cell: ({ row }: { row: Row<any> }) => {
			const { state, reviewComment } = row.original;
			const color: "info" | "success" | "error" | "default" =
				state === "PENDING"
					? "info"
					: state === "APPROVED"
						? "success"
						: state === "REJECTED"
							? "error"
							: "default";

			const translatedState =
				state === "PENDING"
					? "Pendiente"
					: state === "APPROVED"
						? "Aprobado"
						: state === "REJECTED"
							? "Rechazado"
							: state;

			const chip = (
				<Chip label={translatedState} color={color} style={{ width: "100%" }} />
			);

			return reviewComment ? (
				<Tooltip title={reviewComment} arrow>
					<span>{chip}</span>
				</Tooltip>
			) : (
				chip
			);
		},
		size: 150,
	},

	{
		id: "actions",
		header: "Acciones",
		size: 180,
		enableResizing: false,
		cell: ({ row, table }) => {
			const isEditing = table.options.meta?.editingRowId === row.original.id;
			const event = row.original;

			return isEditing ? (
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<Tooltip title="Guardar">
						<IconButton
							color="success"
							onClick={() => table.options.meta?.saveRow?.(event.id)}
						>
							<Check />
						</IconButton>
					</Tooltip>
					<Tooltip title="Cancelar">
						<IconButton
							color="warning"
							onClick={() => table.options.meta?.cancelEdit?.()}
						>
							<Close />
						</IconButton>
					</Tooltip>
				</div>
			) : (
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<Tooltip title="Editar">
						<IconButton
							color="primary"
							onClick={() => table.options.meta?.setEditingRowId?.(event.id)}
						>
							<Edit />
						</IconButton>
					</Tooltip>
					<Tooltip title="Eliminar">
						<IconButton
							color="error"
							onClick={() => onDelete(event.id, event.title)}
						>
							<Delete />
						</IconButton>
					</Tooltip>
					{event.state === "PENDING" && (
						<>
							<Tooltip title="Aprobar">
								<IconButton
									color="success"
									onClick={() => onOpenStatusDialog(event.id, "APPROVED")}
								>
									<Check />
								</IconButton>
							</Tooltip>
							<Tooltip title="Rechazar">
								<IconButton
									color="error"
									onClick={() => onOpenStatusDialog(event.id, "REJECTED")}
								>
									<Close />
								</IconButton>
							</Tooltip>
						</>
					)}
				</div>
			);
		},
	},
];
