'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type ColumnPinningState,
  type ColumnSizingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Input, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, Select, MenuItem, Menu, Checkbox, FormControlLabel } from '@mui/material';

// Extend meta to include our edit functions
declare module '@tanstack/react-table' {
  interface TableMeta<TData extends { id: number }> {
    editingRowId: number | null;
    setEditingRowId: (id: number | null) => void;
    updateData: (rowIndex: number, columnId: string, value: any) => void;
    saveRow: (id: number) => void;
    cancelEdit: () => void;
    validationErrors: Record<string, string>;
  }
}

interface DataTableProps<TData extends { id: number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta: any; // Pass meta from the page component
}

export function DataTable<TData extends { id: number }, TValue>({
  columns,
  data,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ right: ['actions'] });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const table = useReactTable({
    data,
    columns,
    defaultColumn: {
        size: 150, // default size
        enableResizing: true,
    },
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnPinning,
      columnSizing,
    },
    meta,
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Input
          placeholder="Buscar en todas las columnas..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          style={{ width: '500px' }}
        />
        <Button aria-controls="columns-menu" aria-haspopup="true" onClick={handleMenuOpen}>
          Columnas
        </Button>
        <Menu
          id="columns-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem>
            <FormControlLabel
              control={<Checkbox checked={table.getIsAllColumnsVisible()} onChange={table.getToggleAllColumnsVisibilityHandler()} />}
              label="Toggle All"
            />
          </MenuItem>
          {table.getAllLeafColumns().map(column => {
            return (
              <MenuItem key={column.id}>
                <FormControlLabel
                  control={<Checkbox checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />}
                  label={column.id}
                />
              </MenuItem>
            )
          })}
        </Menu>
      </div>
      <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
        <Table style={{ width: '100%', tableLayout: 'fixed' }}>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const { column } = header;
                  return (
                    <TableCell 
                      key={header.id}
                      style={{
                        position: 'relative',
                        width: header.getSize(),
                      }}
                    >
                      <div
                        style={{ 
                          cursor: header.column.getCanSort() ? 'pointer' : 'default',
                          position: column.getIsPinned() ? 'sticky' : 'relative',
                          right: column.getIsPinned() === 'right' ? `${column.getAfter('right')}px` : undefined,
                          zIndex: column.getIsPinned() ? 1 : 0,
                          background: 'white',
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {{
                          'asc': ' 🔼',
                          'desc': ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          style={{
                              position: 'absolute',
                              right: 0,
                              top: 0,
                              height: '100%',
                              width: '3px',
                              background: header.column.getIsResizing() ? 'blue' : 'lightgray',
                              cursor: 'col-resize',
                              userSelect: 'none',
                              touchAction: 'none'
                          }}
                        />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const { column } = cell;
                  return (
                    <TableCell 
                      key={cell.id}
                      style={{
                        position: column.getIsPinned() ? 'sticky' : 'relative',
                        right: column.getIsPinned() === 'right' ? `${column.getAfter('right')}px` : undefined,
                        zIndex: column.getIsPinned() ? 1 : 0,
                        background: 'white',
                        width: cell.column.getSize(),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem', gap: '1rem' }}>
        <Button
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </Button>
        <Button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <span style={{ margin: '0 1rem' }}>
          Página{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </strong>
        </span>
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Siguiente
        </Button>
        <Button
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </Button>
        <Select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <MenuItem key={pageSize} value={pageSize}>
              Mostrar {pageSize}
            </MenuItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
