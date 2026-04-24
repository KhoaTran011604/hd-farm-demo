'use client';

import * as React from 'react';
import { AnimalFilters } from '@/components/animals/animal-filters';
import { AnimalListTable } from '@/components/animals/animal-list-table';
import { useAnimalsQuery } from '@/queries/animals/queries';
import type { AnimalListResponse, AnimalFilters as Filters } from '@/lib/animal-types';

interface AnimalTableProps {
  initialData?: AnimalListResponse;
}

export function AnimalTable({ initialData }: AnimalTableProps): React.JSX.Element {
  const [filters, setFilters] = React.useState<Filters>({ page: 1 });
  const [search, setSearch] = React.useState('');
  const [species, setSpecies] = React.useState<string | undefined>();
  const [pageSize, setPageSize] = React.useState(20);

  const { data, isLoading } = useAnimalsQuery(filters, initialData);

  function handleFilterChange(updated: Partial<Filters>): void {
    setFilters((prev) => ({ ...prev, ...updated, page: 1 }));
  }

  const rawItems = data?.items ?? [];
  const items = rawItems.filter((row) => {
    if (species && row.species !== species) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !row.name.toLowerCase().includes(q) &&
        !row.qrCode.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const currentPage = filters.page ?? 1;

  return (
    <div className="flex flex-col gap-4">
      <AnimalFilters
        filters={filters}
        onChange={handleFilterChange}
        search={search}
        onSearchChange={setSearch}
        species={species}
        onSpeciesChange={setSpecies}
        onExport={() => undefined}
        onImport={() => undefined}
      />

      <AnimalListTable
        rows={items}
        total={data?.total ?? items.length}
        page={currentPage}
        pageSize={pageSize}
        isLoading={isLoading}
        onPrev={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page ?? 1) - 1) }))}
        onNext={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
        onPageSize={setPageSize}
      />
    </div>
  );
}
