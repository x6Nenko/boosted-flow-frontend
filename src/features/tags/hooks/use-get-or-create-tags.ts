import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../api';

export function useGetOrCreateTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (names: string[]) => tagsApi.getOrCreate(names),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
