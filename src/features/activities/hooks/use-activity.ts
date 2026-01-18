import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '../api';

export function useActivity(id: string) {
  return useQuery({
    queryKey: ['activities', id],
    queryFn: () => activitiesApi.get(id),
    staleTime: 60 * 60 * 1000, // 60 minutes
  });
}
