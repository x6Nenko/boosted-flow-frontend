import { useQuery } from '@tanstack/react-query';
import { timeEntriesApi } from '../api';

export function useCurrentEntry() {
  return useQuery({
    queryKey: ['time-entries', 'current'],
    queryFn: timeEntriesApi.current,
    // This endpoint is a re-sync / safety check, not something to poll.
    // The UI should tick locally for live duration.
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
