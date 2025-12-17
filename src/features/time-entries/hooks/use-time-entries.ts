import { useQuery } from '@tanstack/react-query';
import { timeEntriesApi } from '../api';
import type { TimeEntriesQuery } from '../types';

export function useTimeEntries(query?: TimeEntriesQuery) {
  return useQuery({
    queryKey: ['time-entries', query],
    queryFn: () => timeEntriesApi.list(query),
    staleTime: 60 * 60 * 1000, // 60 minutes
  });
}
