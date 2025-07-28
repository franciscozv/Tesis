"use client";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import CreatePerson from "~/components/features/person/CreatePerson";
import { personSchema } from "~/components/features/person/person.validators";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";
import { DataTable } from "~/components/ui/DataTable";
import {
	deletePerson,
	getPeople,
	updatePerson,
} from "~/services/personService";
import { type Person, getColumns } from "./columns";

const Page = () => {
	const [people, setPeople] = useState<Person[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingRowId, setEditingRowId] = useState<number | null>(null);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
	const [personToDelete, setPersonToDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);

	const fetchData = async () => {
		setLoading(true);
		try {
			const data = await getPeople();
			setPeople(data || []);
		} catch (error) {
			console.error("Error al obtener personas:", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	const handleDelete = (id: number, name: string) => {
		setPersonToDelete({ id, name });
		setOpenConfirmDialog(true);
	};

	const handleConfirmDelete = async () => {
		if (personToDelete) {
			try {
				await deletePerson(personToDelete.id);
				fetchData(); // Refrescar datos
			} catch (error) {
				console.error("Error al eliminar la persona:", error);
				alert("Error al eliminar la persona");
			} finally {
				setOpenConfirmDialog(false);
				setPersonToDelete(null);
			}
		}
	};

	const handleCancelDelete = () => {
		setOpenConfirmDialog(false);
		setPersonToDelete(null);
	};

	const handlePersonUpdate = (
		rowIndex: number,
		columnId: string,
		value: any,
	) => {
		setPeople((old) =>
			old.map((row, index) => {
				if (index === rowIndex) {
					return {
						...row,
						[columnId]: value,
					};
				}
				return row;
			}),
		);
	};

	const handleSave = async (personId: number) => {
		const personToUpdate = people.find((p) => p.id === personId);
		if (personToUpdate) {
			const validationResult = personSchema.safeParse(personToUpdate);
			if (!validationResult.success) {
				const newErrors: Record<string, string> = {};
				for (const [key, value] of Object.entries(
					validationResult.error.flatten().fieldErrors,
				)) {
					if (value) newErrors[key] = value.join(", ");
				}
				setValidationErrors(newErrors);
				return; // Detener si hay errores
			}

			setValidationErrors({}); // Limpiar errores si la validación es exitosa
			try {
				await updatePerson(personId, validationResult.data);
				setEditingRowId(null); // Salir del modo edición
			} catch (error) {
				console.error("Error al actualizar la persona:", error);
				alert("Error al actualizar la persona");
				fetchData(); // Revertir cambios si falla la API
			}
		}
	};

	const handleCancel = () => {
		setEditingRowId(null);
		setValidationErrors({}); // Limpiar errores al cancelar
		fetchData(); // Recargar datos originales
	};

	const columns = useMemo(() => getColumns(handleDelete), []);

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Gestión de Personas
			</Typography>

			<Box sx={{ my: 4 }}>
				<CreatePerson onPersonCreated={fetchData} />
			</Box>

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
					<CircularProgress />
					<Typography variant="body1" sx={{ ml: 2 }}>
						Cargando personas...
					</Typography>
				</Box>
			) : (
				<DataTable
					columns={columns}
					data={people}
					meta={{
						editingRowId,
						setEditingRowId,
						updateData: handlePersonUpdate,
						saveRow: handleSave,
						cancelEdit: handleCancel,
						validationErrors,
					}}
				/>
			)}

			{personToDelete && (
				<ConfirmationDialog
					open={openConfirmDialog}
					onClose={handleCancelDelete}
					onConfirm={handleConfirmDelete}
					title="Confirmar Eliminación"
					description={`¿Estás seguro de que deseas eliminar a "${personToDelete.name}"? Esta acción no se puede deshacer.`}
				/>
			)}
		</Box>
	);
};

export default Page;
