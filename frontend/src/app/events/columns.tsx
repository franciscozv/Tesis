'use client';
import { type ColumnDef } from "@tanstack/react-table";
import { Button, Input, FormHelperText, FormControl, Select, MenuItem, Chip, Menu, Checkbox, FormControlLabel } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { useState } from 'react';
import type { Row, Column, Table } from '@tanstack/react-table';

export type Event = {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  location: string;
  state: string;
  eventTypeId: number;
};

// Componente para celdas de texto editables
const TextCell = ({ getValue, row, column, table }: { getValue: () => any, row: Row<any>, column: Column<any>, table: Table<any> }) => {
  const initialValue = getValue();
  const isEditing = table.options.meta?.editingRowId === row.original.id;
  const error = table.options.meta?.validationErrors?.[column.id];

  return isEditing ? (
    <FormControl error={!!error} style={{ width: '100%' }}>
      <Input
        defaultValue={initialValue}
        onChange={(e) => table.options.meta?.updateData?.(row.index, column.id, e.target.value)}
        style={{ width: '100%' }}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  ) : (
    <span>{initialValue}</span>
  );
};

// Componente para celdas de fecha y hora editables
const DateTimeCell = ({ getValue, row, column, table }: { getValue: () => any, row: Row<any>, column: Column<any>, table: Table<any> }) => {
  const initialValue = getValue();
  const isEditing = table.options.meta?.editingRowId === row.original.id;
  const error = table.options.meta?.validationErrors?.[column.id];
  const isStartDate = column.id === 'startDateTime';

  const toDisplayDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = dayjs(dateString);
    if (!date.isValid()) return "N/A";
    return date.format("DD/MM/YYYY HH:mm");
  };

  return isEditing ? (
    <FormControl error={!!error} style={{ width: '100%' }}>
      <DateTimePicker
        value={initialValue ? dayjs(initialValue) : null}
        onChange={(newValue) => {
          table.options.meta?.updateData?.(
            row.index,
            column.id,
            newValue ? newValue.toISOString() : null
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
  onDelete: (id: number, name: string) => void
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
    header: 'Estado',
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue || filterValue.length === 0) return false;
      return filterValue.includes(row.getValue(columnId));
    },
    cell: ({ row }: { row: Row<any> }) => {
      const state = row.original.state;
      const color: 'info' | 'success' | 'error' | 'default' =
        state === 'PENDING' ? 'info'
        : state === 'APPROVED' ? 'success'
        : state === 'REJECTED' ? 'error'
        : 'default';

      const translatedState =
        state === 'PENDING' ? 'Pendiente'
        : state === 'APPROVED' ? 'Aprobado'
        : state === 'REJECTED' ? 'Rechazado'
        : state;

      return <Chip label={translatedState} color={color} style={{ width: '100%' }} />;
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
          <Button variant="outlined" color="success" onClick={() => table.options.meta?.saveRow?.(event.id)}>
            Guardar
          </Button>
          <Button variant="outlined" color="warning" onClick={() => table.options.meta?.cancelEdit?.()}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outlined" color="primary" onClick={() => table.options.meta?.setEditingRowId?.(event.id)}>
            Editar
          </Button>
          <Button variant="outlined" color="error" onClick={() => onDelete(event.id, event.title)}>
            Eliminar
          </Button>
        </div>
      );
    },
  },
];
