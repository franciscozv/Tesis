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

// Helper function to format dates
const formatDate = (dateString: string) => {
	try {
		const date = new Date(dateString);
		if (isNaN(date.getTime())) {
			return "Invalid date";
		}
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	} catch (error) {
		return "Invalid date";
	}
};

// Component for editable text cells
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

// Component for editable date cells
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

	// When not editing, display the formatted date
	if (!isEditing) {
		return <span>{formatDate(initialValue)}</span>;
	}

	// When editing, show a DatePicker
	return (
		<FormControl error={!!error} style={{ width: "100%" }}>
			<DatePicker
				value={initialValue ? dayjs(initialValue) : null}
				onChange={(newValue) => {
					table.options.meta?.updateData?.(row.index, column.id, newValue ? newValue.toISOString() : null);
				}}
				format="DD/MM/YYYY"
				slotProps={{
					textField: {
						fullWidth: true,
						error: !!error,
						helperText: error,
					},
				}}
			/>
		</FormControl>
	);
};

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

	const formattedValue = initialValue === 'MASCULINO' ? 'Masculino' : 'Femenino';

	return isEditing ? (
		<Select
			value={initialValue}
			onChange={(e) =>
				table.options.meta?.updateData?.(row.index, column.id, e.target.value)
			}
			style={{ width: "100%" }}
		>
			<MenuItem value="MASCULINO">Masculino</MenuItem>
			<MenuItem value="FEMENINO">Femenino</MenuItem>
		</Select>
	) : (
		<span>{formattedValue}</span>
	);
};

export const getColumns = (onDelete: (id: number, name: string) => void): ColumnDef<Person>[] => [
    {
        accessorKey: "firstname",
        header: "Nombre",
        cell: TextCell,
    },
    {
        accessorKey: "lastname",
        header: "Apellido",
        cell: TextCell,
    },
    {
        accessorKey: "address",
        header: "Dirección",
        cell: TextCell,
    },
    {
        accessorKey: "phone",
        header: "Teléfono",
        cell: TextCell,
    },
    {
        accessorKey: "baptismDate",
        header: "Fecha de Bautismo",
        cell: DateCell, // Use the new DateCell
    },
    {
        accessorKey: "convertionDate",
        header: "Fecha de Conversión",
        cell: DateCell, // Use the new DateCell
    },
    {
        accessorKey: "birthdate",
        header: "Fecha de Nacimiento",
        cell: DateCell, // Use the new DateCell
    },
    {
        accessorKey: "gender",
        header: "Género",
        cell: GenderCell,
    },
	{
		id: "actions",
		header: "Acciones",
		size: 180,
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
						onClick={() => onDelete(person.id, `${person.firstname} ${person.lastname}`)}
					>
						Eliminar
					</Button>
				</div>
			);
		},
	},
];
