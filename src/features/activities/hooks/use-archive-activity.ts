import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../api';

export function useArchiveActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activitiesApi.archive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', id] });
    },
  });
}
