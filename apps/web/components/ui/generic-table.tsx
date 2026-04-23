'use client';

import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface TablePaginationProps {
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Display: current page number (1-indexed) */
  page?: number;
  /** Display: total item count */
  total?: number;
}

interface GenericTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  /** Client-side pagination: splits data into pages internally */
  pageSize?: number;
  /** Server-side / cursor pagination: caller controls prev/next */
  pagination?: TablePaginationProps;
}

export function GenericTable<TData>({
  data,
  columns,
  isLoading = false,
  onRowClick,
  emptyMessage,
  pageSize,
  pagination,
}: GenericTableProps<TData>): React.JSX.Element {
  const t = useTranslations('table');
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(pageSize != null && {
      getPaginationRowModel: getPaginationRowModel(),
      initialState: { pagination: { pageSize, pageIndex: 0 } },
    }),
  });

  const clientPage = pageSize != null ? table.getState().pagination.pageIndex + 1 : null;
  const totalPages = pageSize != null ? table.getPageCount() : null;

  return (
    <div className="space-y-2">
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
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  {emptyMessage ?? t('empty')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? 'cursor-pointer' : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Client-side pagination */}
      {pageSize != null && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('pageOf', { page: clientPage ?? 1, total: totalPages ?? 1 })}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Server-side / cursor pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          {pagination.page != null && pagination.total != null ? (
            <span className="text-sm text-muted-foreground">
              {t('pageWithResults', { page: pagination.page, total: pagination.total })}
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={pagination.onPrev} disabled={!pagination.hasPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={pagination.onNext} disabled={!pagination.hasNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
