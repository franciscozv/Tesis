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
	Box,
	Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import type { ColumnDef } from "@tanstack/react-table";
import type { Column, Row, Table } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { getEventTypes } from "~/services/eventTypeService";
import PlanningButton from "~/components/features/event/PlanningButton";

// Tipo para los tipos de evento
type EventType = {
	id: number;
	name: string;
	description: string;
	color: string;
};

// Componente para mostrar el tipo de evento con color
const EventTypeChip = ({ eventType }: { eventType?: { name: string; color: string; description: string } }) => {
	if (!eventType) {
		return <Chip label="Sin tipo" variant="outlined" size="small" />;
	}

	return (
		<Tooltip title={eventType.description} arrow>
			<Chip
				label={eventType.name}
				size="small"
				sx={{
					backgroundColor: eventType.color,
					color: getContrastColor(eventType.color),
					fontWeight: 'bold',
					fontSize: '0.7rem',
					height: '18px',
					maxWidth: '120px',
					'& .MuiChip-label': {
						padding: '0 6px',
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					},
					'&:hover': {
						backgroundColor: eventType.color,
						opacity: 0.8,
						transform: 'scale(1.02)',
						transition: 'all 0.2s ease-in-out',
					},
					boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
					borderRadius: '8px',
				}}
			/>
		</Tooltip>
	);
};

// Importar la función de utilidad de colores
import { getContrastColor } from "~/utils/themeColors";

export type Event = {
	id: number;
	title: string;
	description: string;
	startDateTime: string;
	endDateTime: string;
	placeId: number;
	state: string;
	reviewComment?: string;
	eventTypeId: number;
	eventType?: {
		id: number;
		name: string;
		description: string;
		color: string;
	};
	place?: {
		id: number;
		name: string;
		description: string;
	};
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

// Componente para celdas de título con tipo de evento integrado
const TitleCell = ({
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
		<Typography 
			variant="body2" 
			sx={{ 
				fontWeight: 'medium',
				lineHeight: 1.2,
			}}
		>
			{initialValue}
		</Typography>
	);
};

// Componente para editar el tipo de evento
const EventTypeCell = ({
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
	const [eventTypes, setEventTypes] = useState<EventType[]>([]);
	const [loading, setLoading] = useState(false);
	const isEditing = table.options.meta?.editingRowId === row.original.id;
	const error = table.options.meta?.validationErrors?.[column.id];
	const currentEventType = row.original.eventType;

	// Cargar tipos de evento cuando se entra en modo edición
	useEffect(() => {
		if (isEditing && eventTypes.length === 0) {
			setLoading(true);
			getEventTypes()
				.then((types) => {
					setEventTypes(types || []);
				})
				.catch((error) => {
					console.error("Error al cargar tipos de evento:", error);
				})
				.finally(() => {
					setLoading(false);
				});
		}
	}, [isEditing, eventTypes.length]);

	return isEditing ? (
		<FormControl error={!!error} style={{ width: "100%" }}>
			<Select
				value={currentEventType?.id || ""}
				onChange={(e) => {
					const selectedType = eventTypes.find(type => type.id === e.target.value);
					table.options.meta?.updateData?.(row.index, "eventTypeId", e.target.value);
					table.options.meta?.updateData?.(row.index, "eventType", selectedType);
				}}
				displayEmpty
				size="small"
				disabled={loading}
				renderValue={(value) => {
					if (!value) return <em>Seleccionar tipo</em>;
					const selectedType = eventTypes.find(type => type.id === value);
					if (!selectedType) return <em>Seleccionar tipo</em>;
					
					return (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Box
								sx={{
									width: '12px',
									height: '12px',
									backgroundColor: selectedType.color,
									borderRadius: '50%',
									flexShrink: 0,
									boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
								}}
							/>
							<Typography variant="body2">{selectedType.name}</Typography>
						</Box>
					);
				}}
			>
				<MenuItem value="">
					<em>Seleccionar tipo</em>
				</MenuItem>
				{eventTypes.map((type) => (
					<MenuItem key={type.id} value={type.id}>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
							<Box
								sx={{
									width: '12px',
									height: '12px',
									backgroundColor: type.color,
									borderRadius: '50%',
									flexShrink: 0,
									boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
								}}
							/>
							<Typography variant="body2" sx={{ flex: 1 }}>{type.name}</Typography>
						</Box>
					</MenuItem>
				))}
			</Select>
			{error && <FormHelperText>{error}</FormHelperText>}
		</FormControl>
	) : (
		<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '32px' }}>
			<EventTypeChip eventType={currentEventType} />
		</Box>
	);
};

export const getColumns = (
	onDelete: (id: number, name: string) => void,
	onOpenStatusDialog: (id: number, action: "APPROVED" | "REJECTED") => void,
): ColumnDef<Event>[] => [
	{
		accessorKey: "title",
		header: "Título",
		cell: TitleCell,
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
		accessorKey: "place.name",
		header: "Ubicación",
		cell: TextCell,
		size: 200,
	},
	{
		accessorKey: "eventType",
		header: "Tipo de Evento",
		cell: EventTypeCell,
		size: 150,
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
					<PlanningButton eventId={event.id} eventState={event.state} />
				</div>
			);
		},
	},
];
