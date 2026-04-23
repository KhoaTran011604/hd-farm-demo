'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { GenericTable } from '@/components/ui/generic-table';
import { StatusBadge } from '@/components/animals/status-badge';
import { AnimalFilters } from '@/components/animals/animal-filters';
import { useAnimalsQuery } from '@/queries/animals/queries';
import type { AnimalRow, AnimalListResponse, AnimalFilters as Filters } from '@/lib/animal-types';
import { SPECIES_LABELS } from '@/lib/animal-types';
import { formatDate } from '@/lib/utils';

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

  const { data, isLoading } = useAnimalsQuery(filters, initialData);

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

      <GenericTable
        data={data?.items ?? []}
        columns={columns}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/animals/${row.id}`)}
      />

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
