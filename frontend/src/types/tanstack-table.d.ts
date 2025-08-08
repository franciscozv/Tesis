import "@tanstack/react-table";

declare module "@tanstack/react-table" {
	interface TableMeta<TData extends RowData> {
		editingRowId?: number | null;
		setEditingRowId?: (id: number | null) => void;
		validationErrors?: Record<string, string>;
		updateData?: (rowIndex: number, columnId: string, value: any) => void;
		saveRow?: (id: number) => void;
		cancelEdit?: () => void;
		eventTypes?: any[];
		places?: any[];
	}
}
