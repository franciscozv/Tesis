'use client';
import { type ColumnDef, type Row, type Column, type Table } from "@tanstack/react-table";
import { Button, Input, FormHelperText, FormControl } from "@mui/material";

export type EventType = {
  id: number;
  name: string;
  description: string;
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

export const getColumns = (
  onDelete: (id: number, name: string) => void
): ColumnDef<EventType>[] => [
  {
    accessorKey: "name",
    header: "Nombre",
    cell: TextCell,
    size: 200,
  },
  {
    accessorKey: "description",
    header: "Descripción",
    cell: TextCell,
    size: 400,
  },
  {
    id: "actions",
    header: "Acciones",
    size: 180,
    enableResizing: false,
    cell: ({ row, table }) => {
      const isEditing = table.options.meta?.editingRowId === row.original.id;
      const eventType = row.original;

      return isEditing ? (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outlined" color="success" onClick={() => table.options.meta?.saveRow?.(eventType.id)}>
            Guardar
          </Button>
          <Button variant="outlined" color="warning" onClick={() => table.options.meta?.cancelEdit?.()}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outlined" color="primary" onClick={() => table.options.meta?.setEditingRowId?.(eventType.id)}>
            Editar
          </Button>
          <Button variant="outlined" color="error" onClick={() => onDelete(eventType.id, eventType.name)}>
            Eliminar
          </Button>
        </div>
      );
    },
  },
];
