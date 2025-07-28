"use client";
import {
	Button,
	FormControl,
	FormHelperText,
	Input,
	MenuItem,
	Select,
} from "@mui/material";
import type { Column, ColumnDef, Row, Table } from "@tanstack/react-table";

export type Person = {
	id: number;
	firstname: string;
	lastname: string;
	address: string;
	phone: string;
	baptismDate: string;
	convertionDate: string;
	birthdate: string;
	gender: string;
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

import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

// Componente para celdas de fecha editables
const DateCell = ({
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
	const yesterday = dayjs().subtract(1, "day");

	const toDisplayDate = (dateString: string) => {
		if (!dateString) return "N/A";
		const date = dayjs(dateString);
		if (!date.isValid()) return "N/A";
		return date.format("DD/MM/YYYY");
	};

	return isEditing ? (
		<FormControl error={!!error} style={{ width: "100%" }}>
			<DatePicker
				value={initialValue ? dayjs(initialValue) : null}
				onChange={(newValue) => {
					table.options.meta?.updateData?.(
						row.index,
						column.id,
						newValue ? newValue.toISOString() : null,
					);
				}}
				maxDate={yesterday}
				format="DD/MM/YYYY"
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

// Componente para celda de género editable (Select)
const GenderCell = ({
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
			<Select
				defaultValue={initialValue}
				onChange={(e) =>
					table.options.meta?.updateData?.(row.index, column.id, e.target.value)
				}
				style={{ width: "100%" }}
			>
				<MenuItem value="Masculino">Masculino</MenuItem>
				<MenuItem value="Femenino">Femenino</MenuItem>
			</Select>
			{error && <FormHelperText>{error}</FormHelperText>}
		</FormControl>
	) : (
		<span>{initialValue}</span>
	);
};

export const getColumns = (
	onDelete: (id: number, name: string) => void,
): ColumnDef<Person>[] => [
	{
		accessorKey: "firstname",
		header: "Nombre",
		cell: TextCell,
		size: 150,
	},
	{
		accessorKey: "lastname",
		header: "Apellido",
		cell: TextCell,
		size: 150,
	},
	{
		accessorKey: "phone",
		header: "Teléfono",
		cell: TextCell,
		size: 120,
	},
	{
		accessorKey: "address",
		header: "Dirección",
		cell: TextCell,
		size: 250,
	},
	{
		accessorKey: "birthdate",
		header: "F. Nacimiento",
		cell: DateCell,
		size: 150,
	},
	{
		accessorKey: "convertionDate",
		header: "F. Conversión",
		cell: DateCell,
		size: 150,
	},
	{
		accessorKey: "baptismDate",
		header: "F. Bautismo",
		cell: DateCell,
		size: 150,
	},
	{
		accessorKey: "gender",
		header: "Género",
		cell: GenderCell,
		size: 120,
	},
	{
		id: "actions",
		header: "Acciones",
		size: 180, // Asignar un tamaño fijo para los botones
		enableResizing: false,
		cell: ({ row, table }) => {
			const isEditing = table.options.meta?.editingRowId === row.original.id;
			const person = row.original;

			return isEditing ? (
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<Button
						variant="outlined"
						color="success"
						onClick={() => table.options.meta?.saveRow?.(person.id)}
					>
						Guardar
					</Button>
					<Button
						variant="outlined"
						color="warning"
						onClick={() => table.options.meta?.cancelEdit?.()}
					>
						Cancelar
					</Button>
				</div>
			) : (
				<div style={{ display: "flex", gap: "0.5rem" }}>
					<Button
						variant="outlined"
						color="primary"
						onClick={() => table.options.meta?.setEditingRowId?.(person.id)}
					>
						Editar
					</Button>
					<Button
						variant="outlined"
						color="error"
						onClick={() =>
							onDelete(person.id, `${person.firstname} ${person.lastname}`)
						}
					>
						Eliminar
					</Button>
				</div>
			);
		},
	},
];
