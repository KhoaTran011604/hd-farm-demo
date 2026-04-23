'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { GenericTable } from '@/components/ui/generic-table';
import { StatusBadge } from '@/components/animals/status-badge';
import { AnimalFilters } from '@/components/animals/animal-filters';
import { useAnimalsQuery } from '@/queries/animals/queries';
import type { AnimalRow, AnimalListResponse, AnimalFilters as Filters } from '@/lib/animal-types';
import { formatDate } from '@/lib/utils';

interface AnimalTableProps {
  initialData?: AnimalListResponse;
}

export function AnimalTable({ initialData }: AnimalTableProps): React.JSX.Element {
  const router = useRouter();
  const tFields = useTranslations('animals.fields');
  const tSpecies = useTranslations('animals.species');
  const [filters, setFilters] = useState<Filters>({ page: 1 });

  const { data, isLoading } = useAnimalsQuery(filters, initialData);

  const columns = useMemo<ColumnDef<AnimalRow>[]>(
    () => [
      { accessorKey: 'name', header: tFields('name') },
      {
        accessorKey: 'species',
        header: tFields('species'),
        cell: ({ row }) => tSpecies(row.original.species),
      },
      {
        accessorKey: 'status',
        header: tFields('status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      { id: 'pen', header: tFields('pen'), cell: ({ row }) => row.original.pen?.name ?? '—' },
      { id: 'zone', header: tFields('zone'), cell: ({ row }) => row.original.zone?.name ?? '—' },
      {
        accessorKey: 'createdAt',
        header: tFields('createdAt'),
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
    ],
    [tFields, tSpecies],
  );

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;
  const currentPage = filters.page ?? 1;

  function handleFilterChange(updated: Partial<Filters>): void {
    setFilters((prev) => ({ ...prev, ...updated, page: 1 }));
  }

  return (
    <div className="space-y-4">
      <AnimalFilters filters={filters} onChange={handleFilterChange} />

      <GenericTable
        data={data?.items ?? []}
        columns={columns}
        isLoading={isLoading}
        onRowClick={(row) => router.push(`/animals/${row.id}`)}
        pagination={{
          hasPrev: currentPage > 1,
          hasNext: currentPage < totalPages,
          onPrev: () => setFilters((f) => ({ ...f, page: currentPage - 1 })),
          onNext: () => setFilters((f) => ({ ...f, page: currentPage + 1 })),
          page: currentPage,
          total: data?.total,
        }}
      />
    </div>
  );
}
