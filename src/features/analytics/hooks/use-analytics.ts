import { useMemo } from 'react';
import { useTimeEntries } from '@/features/time-entries/hooks';
import { computeAnalytics } from '../analytics.utils';
import type { AnalyticsQuery } from '../types';

export function useAnalytics(query?: AnalyticsQuery) {
  const { data: entries, isLoading, error } = useTimeEntries(query);

  const analytics = useMemo(() => {
    if (!entries) return null;
    return computeAnalytics(entries);
  }, [entries]);

  return { data: analytics, isLoading, error };
}
