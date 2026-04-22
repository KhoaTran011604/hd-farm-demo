'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/animals/status-badge';
import { AnimalFilters } from '@/components/animals/animal-filters';
import type { AnimalRow, AnimalListResponse, AnimalFilters as Filters } from '@/lib/animal-types';
import { SPECIES_LABELS } from '@/lib/animal-types';
import { formatDate } from '@/lib/utils';

async function fetchAnimals(filters: Filters): Promise<AnimalListResponse> {
  const params = new URLSearchParams();
  if (filters.farmId) params.set('farmId', filters.farmId);
  if (filters.zoneId) params.set('zoneId', filters.zoneId);
  if (filters.penId) params.set('penId', filters.penId);
  if (filters.status) params.set('status', filters.status);
  if (filters.cursor) params.set('cursor', filters.cursor);
  const res = await fetch(`/api/proxy/animals?${params}`);
  if (!res.ok) throw new Error('Failed to fetch animals');
  return res.json() as Promise<AnimalListResponse>;
}

const columns: ColumnDef<AnimalRow>[] = [
  { accessorKey: 'name', header: 'Tên' },
  { accessorKey: 'species', header: 'Loài', cell: ({ row }) => SPECIES_LABELS[row.original.species] ?? row.original.species },
  { accessorKey: 'status', header: 'Trạng thái', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { id: 'pen', header: 'Ô chuồng', cell: ({ row }) => row.original.pen?.name ?? '—' },
  { id: 'zone', header: 'Khu vực', cell: ({ row }) => row.original.zone?.name ?? '—' },
  { accessorKey: 'createdAt', header: 'Ngày nhập', cell: ({ row }) => formatDate(row.original.createdAt) },
];

interface AnimalTableProps {
  initialData?: AnimalListResponse;
}

export function AnimalTable({ initialData }: AnimalTableProps): React.JSX.Element {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({});
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);

  const { data, isLoading } = useQuery<AnimalListResponse>({
    queryKey: ['animals', filters],
    queryFn: () => fetchAnimals(filters),
    initialData: !filters.farmId && !filters.status ? initialData : undefined,
  });

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  function handleFilterChange(updated: Partial<Filters>): void {
    setFilters((prev) => ({ ...prev, ...updated, cursor: undefined }));
    setCursorHistory([]);
  }

  function handleNext(): void {
    if (!data?.nextCursor) return;
    setCursorHistory((h) => [...h, filters.cursor ?? '']);
    setFilters((prev) => ({ ...prev, cursor: data.nextCursor ?? undefined }));
  }

  function handlePrev(): void {
    const prev = cursorHistory[cursorHistory.length - 1] ?? undefined;
    setCursorHistory((h) => h.slice(0, -1));
    setFilters((f) => ({ ...f, cursor: prev }));
  }

  return (
    <div className="space-y-4">
      <AnimalFilters filters={filters} onChange={handleFilterChange} />

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">Không có dữ liệu</TableCell></TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => router.push(`/animals/${row.original.id}`)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={cursorHistory.length === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={handleNext} disabled={!data?.nextCursor}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
