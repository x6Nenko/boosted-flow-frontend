import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '../api';

export function useActivities(includeArchived = false) {
  return useQuery({
    queryKey: ['activities', { includeArchived }],
    queryFn: () => activitiesApi.list(includeArchived),
    staleTime: 60 * 60 * 1000, // 60 minutes
  });
}
