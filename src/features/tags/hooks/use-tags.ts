import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '../api';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
    staleTime: 60 * 60 * 1000, // 60 minutes
  });
}
