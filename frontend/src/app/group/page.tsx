"use client";
import { useEffect, useState } from "react";
import CreateGroupForm from "../../components/features/group/CreateGroupForm";

import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { groupSchema } from "~/components/features/group/group.validators";
import ConfirmationDialog from "~/components/ui/ConfirmationDialog";
import { DataTable } from "~/components/ui/DataTable";
import { deleteGroup, getGroups, updateGroup } from "~/services/groupService";
import { type Group, getColumns } from "./columns";

const Page = () => {
	const [groups, setGroups] = useState<Group[]>([]);
	const [loading, setLoading] = useState(true);
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
	const [groupToDelete, setGroupToDelete] = useState<{
		id: number;
		name: string;
	} | null>(null);
	const [editingRowId, setEditingRowId] = useState<number | null>(null);
	const [originalData, setOriginalData] = useState<Group[]>([]);
	const [validationErrors, setValidationErrors] = useState<
		Record<string, string>
	>({});

	const fetchData = async () => {
		try {
			const data = await getGroups();
			setGroups(data || []);
			setOriginalData(data || []);
		} catch (error) {
			console.error("Error al obtener grupos:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateData = (rowIndex: number, columnId: string, value: any) => {
		setGroups((old) =>
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

	const handleSaveRow = async (id: number) => {
		const rowToSave = groups.find((row) => row.id === id);
		if (!rowToSave) return;

		const validationResult = groupSchema.safeParse(rowToSave);

		if (!validationResult.success) {
			const newErrors: Record<string, string> = {};
			for (const [key, value] of Object.entries(
				validationResult.error.flatten().fieldErrors,
			)) {
				if (value) newErrors[key] = value.join(", ");
			}
			setValidationErrors(newErrors);
			return;
		}

		setValidationErrors({});

		try {
			const updatedGroup = await updateGroup(id, validationResult.data);
			setGroups((old) =>
				old.map((row) => (row.id === id ? updatedGroup : row)),
			);
			setEditingRowId(null);
		} catch (error) {
			console.error("Error al guardar el grupo:", error);
			// Optionally set an error message for the user
		}
	};

	const handleCancelEdit = () => {
		setEditingRowId(null);
		setGroups(originalData); // Revert to original data
		setValidationErrors({});
	};

	const handleDelete = (id: number, name: string) => {
		setGroupToDelete({ id, name });
		setOpenConfirmDialog(true);
	};

	const handleConfirmDelete = async () => {
		if (groupToDelete) {
			try {
				const data = await deleteGroup(groupToDelete.id);

				if (data) {
					fetchData();
				} else {
					alert(`Error al eliminar grupo: ${data.message}`);
				}
			} catch (error) {
				console.error("Error al eliminar:", error);
			} finally {
				setOpenConfirmDialog(false);
				setGroupToDelete(null);
			}
		}
	};

	const handleCancelDelete = () => {
		setOpenConfirmDialog(false);
		setGroupToDelete(null);
	};

	useEffect(() => {
		fetchData();
	}, []);

	const columns = getColumns(handleDelete);

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Gestión de Grupos
			</Typography>

			<Box sx={{ my: 4 }}>
				<CreateGroupForm onGroupCreated={fetchData} />
			</Box>

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
					<CircularProgress />
					<Typography variant="body1" sx={{ ml: 2 }}>
						Cargando grupos...
					</Typography>
				</Box>
			) : groups.length === 0 ? (
				<Typography variant="body1" sx={{ my: 4 }}>
					No se encontraron grupos.
				</Typography>
			) : (
				<DataTable
					columns={columns}
					data={groups}
					meta={{
						editingRowId,
						setEditingRowId,
						updateData: handleUpdateData,
						saveRow: handleSaveRow,
						cancelEdit: handleCancelEdit,
						validationErrors,
					}}
				/>
			)}

			{groupToDelete && (
				<ConfirmationDialog
					open={openConfirmDialog}
					onClose={handleCancelDelete}
					onConfirm={handleConfirmDelete}
					title="Confirmar Eliminación"
					description={`¿Estás seguro de que deseas eliminar el grupo "${groupToDelete.name}"? Esta acción no se puede deshacer.`}
				/>
			)}
		</Box>
	);
};

export default Page;
