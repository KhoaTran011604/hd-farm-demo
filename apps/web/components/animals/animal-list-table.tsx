'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronLeft, ChevronRight, Columns3, MoreHorizontal } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { StatusBadge } from '@/components/animals/status-badge';
import type { AnimalRow } from '@/lib/animal-types';
import { formatDate } from '@/lib/utils';

interface AnimalListTableProps {
  rows: AnimalRow[];
  total: number;
  page: number;
  pageSize: number;
  isLoading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSize: (size: number) => void;
}

function zoneChipClass(zoneName: string | undefined): string {
  if (!zoneName) return 'bg-[#F0FDF4] text-primary';
  const map: Record<string, string> = {
    A: 'bg-[#F0FDF4] text-primary',
    B: 'bg-[#FFF7ED] text-[#C2410C]',
    C: 'bg-[#EFF6FF] text-[#1D4ED8]',
    D: 'bg-[#FFEDD5] text-[#9A3412]',
  };
  const key = zoneName.replace(/[^A-Z]/g, '').charAt(0);
  return map[key] ?? map.A;
}

export function AnimalListTable({
  rows,
  total,
  page,
  pageSize,
  isLoading,
  onPrev,
  onNext,
  onPageSize,
}: AnimalListTableProps): React.JSX.Element {
  const tMeta = useTranslations('animals.tableMeta');
  const tFields = useTranslations('animals.fields');
  const tSpecies = useTranslations('animals.species');
  const tBulk = useTranslations('animals.bulk');
  const router = useRouter();

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggleAll(): void {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  }

  function toggleOne(id: string): void {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildPageButtons(): (number | '…')[] {
    const pages: (number | '…')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (page > 3) pages.push('…');
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 ? (
        <div className="flex items-center gap-3 rounded-lg bg-primary px-4 py-2.5">
          <Check className="h-4 w-4 text-white" />
          <span className="text-[13px] font-semibold text-white">
            {tBulk('selected', { count: selected.size })}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              className="h-[34px] rounded-md border border-white/25 bg-white/15 px-3.5 text-[12.5px] font-semibold text-white hover:bg-white/25"
            >
              {tBulk('moveZone')}
            </button>
            <button
              type="button"
              className="h-[34px] rounded-md border border-white/25 bg-white/15 px-3.5 text-[12.5px] font-semibold text-white hover:bg-white/25"
            >
              {tBulk('updateStatus')}
            </button>
            <button
              type="button"
              className="h-[34px] rounded-md border border-white/25 bg-white/15 px-3.5 text-[12.5px] font-semibold text-white hover:bg-white/25"
            >
              {tBulk('recordVaccine')}
            </button>
            <button
              type="button"
              className="h-[34px] rounded-md bg-[#DC2626] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#B91C1C]"
            >
              {tBulk('delete')}
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 py-3.5">
          <span className="text-[13px] font-medium text-[#9CA3AF]">
            {tMeta('showing', { from, to, total })}
          </span>
          <button
            type="button"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs text-[#4B5563] hover:bg-background"
          >
            <Columns3 className="h-3.5 w-3.5" />
            {tMeta('columnsBtn')}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-background">
                <th className="w-12 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded-sm border-[1.5px] border-[#D1D5DB] accent-primary"
                  />
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold uppercase text-[#6B7280]">
                  {tMeta('idCol')}
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold uppercase text-[#6B7280]">
                  {tMeta('nameCol')}
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold uppercase text-[#6B7280]">
                  {tFields('zone')}
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold uppercase text-[#6B7280]">
                  {tFields('species')}
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold uppercase text-[#6B7280]">
                  {tFields('status')}
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold uppercase text-[#6B7280]">
                  {tMeta('weightCol')}
                </th>
                <th className="h-11 px-4 text-left text-xs font-semibold uppercase text-[#6B7280]">
                  {tMeta('lastWeighed')}
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F9FAFB]">
                    <td colSpan={9} className="h-12 animate-pulse bg-[#FAFAFA]" />
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-8 text-center text-[13px] text-[#9CA3AF]"
                  >
                    {tFields('name')}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const isSelected = selected.has(row.id);
                  const zoneName = row.zone?.name ?? '—';
                  const shortId = row.qrCode?.slice(-6).toUpperCase() ?? row.id.slice(0, 6);
                  return (
                    <tr
                      key={row.id}
                      className="cursor-pointer border-b border-[#F9FAFB] transition-colors hover:bg-background last:border-b-0"
                      onClick={() => router.push(`/animals/${row.id}`)}
                    >
                      <td
                        className="w-12 px-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(row.id)}
                          className="h-4 w-4 cursor-pointer rounded-sm border-[1.5px] border-[#D1D5DB] accent-primary"
                        />
                      </td>
                      <td className="h-12 px-4">
                        <span className="font-mono text-[12.5px] font-semibold text-primary">
                          {shortId}
                        </span>
                      </td>
                      <td className="h-12 px-4">
                        <div className="text-[13.5px] font-semibold text-[#1A2E0A]">
                          {row.name}
                        </div>
                        <div className="text-[11.5px] text-[#9CA3AF]">
                          {row.pen?.name ?? '—'}
                        </div>
                      </td>
                      <td className="h-12 px-4">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${zoneChipClass(zoneName)}`}
                        >
                          {zoneName}
                        </span>
                      </td>
                      <td className="h-12 px-4 text-[13.5px] text-[#1A2E0A]">
                        {tSpecies(row.species)}
                      </td>
                      <td className="h-12 px-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="h-12 px-4">
                        <div className="text-[13.5px] font-semibold text-[#1A2E0A]">—</div>
                        <div className="text-[11px] text-[#9CA3AF]">—</div>
                      </td>
                      <td className="h-12 px-4 text-[13px] text-[#4B5563]">
                        {formatDate(row.createdAt)}
                      </td>
                      <td
                        className="h-12 px-2 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          aria-label="Row actions"
                          className="rounded-md p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#1A2E0A]"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-[#F3F4F6] px-5 py-3.5">
          <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
            {tMeta('rowsPerPage')}
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="h-8 rounded-md border border-[#E5E7EB] bg-white px-2 text-[13px] text-[#4B5563] focus:outline-none"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            {tMeta('rows')}
          </div>
          <div className="text-[13px] text-[#9CA3AF]">
            {tMeta('pageOf', { page, total: totalPages })}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrev}
              disabled={page <= 1}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {buildPageButtons().map((p, i) =>
              p === '…' ? (
                <span
                  key={`dots-${i}`}
                  className="flex h-[34px] w-[34px] items-center justify-center text-[13px] text-[#9CA3AF]"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={`flex h-[34px] w-[34px] items-center justify-center rounded-md border text-[13px] font-medium ${
                    p === page
                      ? 'border-primary bg-primary text-white'
                      : 'border-[#E5E7EB] bg-white text-[#4B5563] hover:border-primary-light hover:text-primary'
                  }`}
                >
                  {p}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={onNext}
              disabled={page >= totalPages}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
