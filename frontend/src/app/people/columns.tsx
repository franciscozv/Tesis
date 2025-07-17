'use client';
import { type ColumnDef } from "@tanstack/react-table";
import { Button, Input, Select, MenuItem, FormHelperText, FormControl } from "@mui/material";

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
const TextCell = ({ getValue, row, column, table }) => {
  const initialValue = getValue();
  const isEditing = table.options.meta?.editingRowId === row.original.id;
  const error = table.options.meta?.validationErrors?.[column.id];

  return isEditing ? (
    <FormControl error={!!error} style={{ width: '100%' }}>
      <Input
        defaultValue={initialValue}
        onChange={(e) => table.options.meta?.updateData(row.index, column.id, e.target.value)}
        style={{ width: '100%' }}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  ) : (
    <span>{initialValue}</span>
  );
};

// Componente para celdas de fecha editables
const DateCell = ({ getValue, row, column, table }) => {
  const initialValue = getValue();
  const isEditing = table.options.meta?.editingRowId === row.original.id;
  const error = table.options.meta?.validationErrors?.[column.id];

  const toInputDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const toDisplayDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return isEditing ? (
    <FormControl error={!!error} style={{ width: '100%' }}>
      <Input
        type="date"
        defaultValue={toInputDate(initialValue)}
        onChange={(e) => table.options.meta?.updateData(row.index, column.id, e.target.value)}
        style={{ width: '100%' }}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  ) : (
    <span>{toDisplayDate(initialValue)}</span>
  );
};

// Componente para celda de género editable (Select)
const GenderCell = ({ getValue, row, column, table }) => {
  const initialValue = getValue();
  const isEditing = table.options.meta?.editingRowId === row.original.id;
  const error = table.options.meta?.validationErrors?.[column.id];

  return isEditing ? (
    <FormControl error={!!error} style={{ width: '100%' }}>
      <Select
        defaultValue={initialValue}
        onChange={(e) => table.options.meta?.updateData(row.index, column.id, e.target.value)}
        style={{ width: '100%' }}
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
  onDelete: (id: number, name: string) => void
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
          <Button variant="outlined" color="success" onClick={() => table.options.meta?.saveRow(person.id)}>
            Guardar
          </Button>
          <Button variant="outlined" color="warning" onClick={() => table.options.meta?.cancelEdit()}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button variant="outlined" color="primary" onClick={() => table.options.meta?.setEditingRowId(person.id)}>
            Editar
          </Button>
          <Button variant="outlined" color="error" onClick={() => onDelete(person.id, `${person.firstname} ${person.lastname}`)}>
            Eliminar
          </Button>
        </div>
      );
    },
  },
];