"use client";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@mui/material";

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

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

export const getColumns = (
  onEdit: (person: Person) => void,
  onDelete: (id: number, name: string) => void
): ColumnDef<Person>[] => [
  {
    accessorKey: "firstname",
    header: "Nombre",
  },
  {
    accessorKey: "lastname",
    header: "Apellido",
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
  },
  {
    accessorKey: "address",
    header: "Dirección",
  },
  {
    accessorKey: "birthdate",
    header: "F. Nacimiento",
    cell: ({ row }) => formatDate(row.original.birthdate),
  },
  {
    accessorKey: "convertionDate",
    header: "F. Conversión",
    cell: ({ row }) => formatDate(row.original.convertionDate),
  },
  {
    accessorKey: "baptismDate",
    header: "F. Bautismo",
    cell: ({ row }) => formatDate(row.original.baptismDate),
  },
  {
    accessorKey: "gender",
    header: "Género",
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const person = row.original;
      return (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => onEdit(person)}
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