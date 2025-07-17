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
} from '@tanstack/react-table';
import { useState } from 'react';
import { Input, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, Select, MenuItem, Menu, Checkbox, FormControlLabel } from '@mui/material';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({ right: ['actions'] });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      columnPinning,
    },
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
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const { column } = header;
                  return (
                    <TableCell 
                      key={header.id}
                      style={{
                        position: column.getIsPinned() ? 'sticky' : 'relative',
                        right: column.getIsPinned() === 'right' ? `${column.getAfter('right')}px` : undefined,
                        zIndex: column.getIsPinned() ? 1 : 0,
                        background: 'white',
                      }}
                    >
                      <div
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
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
