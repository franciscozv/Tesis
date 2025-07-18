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
  type FilterFn,
} from '@tanstack/react-table';
import { useState } from 'react';
import { Input, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, TableContainer, Select, MenuItem, Menu, Checkbox, FormControlLabel, IconButton, Popover } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

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
  // Estado para el filtro de estado
  const allStates = ['PENDING', 'APPROVED', 'REJECTED'];
  const [stateFilter, setStateFilter] = useState<string[]>([...allStates]);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);

  // Manejar apertura/cierre del menú de filtro
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  const openFilterMenu = Boolean(filterAnchorEl);

  // Lógica de checkboxes
  const isAllChecked = stateFilter.length === allStates.length;
  const isIndeterminate = false;

  const handleStateFilterChange = (value: string) => {
    let newFilter: string[];
    if (value === 'ALL') {
      if (isAllChecked) {
        newFilter = [];
      } else {
        newFilter = [...allStates];
      }
    } else {
      if (stateFilter.includes(value)) {
        newFilter = stateFilter.filter((v) => v !== value);
      } else {
        newFilter = [...stateFilter, value];
      }
    }
    setStateFilter(newFilter);
    setColumnFilters((prev) => {
      const filtered = prev.filter(f => f.id !== 'state');
      // Siempre pasar el array, aunque esté vacío, para que tanstack table filtre correctamente
      return [...filtered, { id: 'state', value: newFilter }];
    });
  };

  // Filtro personalizado para la columna 'state'
  const stateFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
    if (!filterValue || filterValue.length === 0) return true;
    return filterValue.includes(row.getValue(columnId));
  };

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
    filterFns: {
      state: stateFilterFn,
    },
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <Input
          placeholder="Buscar en todas las columnas..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          style={{ width: '350px' }}
        />
        {/* Botón de filtro de estado */}
        <IconButton onClick={handleFilterClick} color={stateFilter.length > 0 ? 'primary' : 'default'}>
          <FilterListIcon />
        </IconButton>
        <Popover
          open={openFilterMenu}
          anchorEl={filterAnchorEl}
          onClose={handleFilterClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={() => handleStateFilterChange('ALL')}
                />
              }
              label="Toggle All"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stateFilter.includes('PENDING')}
                  onChange={() => handleStateFilterChange('PENDING')}
                />
              }
              label="Pendiente"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stateFilter.includes('APPROVED')}
                  onChange={() => handleStateFilterChange('APPROVED')}
                />
              }
              label="Aprobado"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={stateFilter.includes('REJECTED')}
                  onChange={() => handleStateFilterChange('REJECTED')}
                />
              }
              label="Rechazado"
            />
          </div>
        </Popover>
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
