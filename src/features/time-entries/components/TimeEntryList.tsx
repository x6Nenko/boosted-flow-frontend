import { memo, useMemo } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import { TimeEntryRow } from './TimeEntryRow';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TimeEntry } from '../types';
import type { Activity } from '@/features/activities/types';

/* ── Pagination page numbers ── */
function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) pages.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('ellipsis');

  pages.push(total);
  return pages;
}

/* ── Pagination controls ── */
const PaginationControls = memo(function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions,
  hasPrev,
  hasNext,
  setPage,
  setPageSize,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions: readonly number[];
  hasPrev: boolean;
  hasNext: boolean;
  setPage: (p: number) => void;
  setPageSize: (s: 20 | 50 | 100) => void;
}) {
  if (totalItems <= pageSizeOptions[0]) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-border/30 mt-4">
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rows</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => setPageSize(Number(v) as 20 | 50 | 100)}
        >
          <SelectTrigger className="h-7 w-[70px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)} className="text-xs">
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          of {totalItems}
        </span>
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent className='flex max-sm:flex-wrap'>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => hasPrev && setPage(page - 1)}
                className={hasPrev ? 'cursor-pointer' : 'pointer-events-none opacity-40'}
              />
            </PaginationItem>

            {pageNumbers.map((p, i) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => setPage(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                onClick={() => hasNext && setPage(page + 1)}
                className={hasNext ? 'cursor-pointer' : 'pointer-events-none opacity-40'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
});

/* ── Main list component ── */
type TimeEntryListProps = {
  entries: TimeEntry[];
  /** Single activity for activity-page mode */
  activity?: Activity;
  /** Map of activityId → Activity for dashboard mode */
  activitiesMap?: Map<string, Activity>;
  showActivityName?: boolean;
  editable?: boolean;
  showDetails?: boolean;
  emptyMessage?: string;
};

export const TimeEntryList = memo(function TimeEntryList({
  entries,
  activity,
  activitiesMap,
  showActivityName = false,
  editable = false,
  showDetails = false,
  emptyMessage = 'No time entries yet.',
}: TimeEntryListProps) {
  // Filter stopped entries once
  const stoppedEntries = useMemo(
    () => entries.filter((e) => e.stoppedAt),
    [entries],
  );

  const pagination = usePagination(stoppedEntries);

  if (stoppedEntries.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div>
      <div>
        {pagination.paginatedItems.map((entry) => (
          <div key={entry.id} style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 64px' }}>
            <TimeEntryRow
              entry={entry}
              activity={activity ?? activitiesMap?.get(entry.activityId)}
              showActivityName={showActivityName}
              editable={editable}
              showDetails={showDetails}
            />
          </div>
        ))}
      </div>

      <PaginationControls
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        pageSizeOptions={pagination.pageSizeOptions}
        hasPrev={pagination.hasPrev}
        hasNext={pagination.hasNext}
        setPage={pagination.setPage}
        setPageSize={pagination.setPageSize}
      />
    </div>
  );
});
