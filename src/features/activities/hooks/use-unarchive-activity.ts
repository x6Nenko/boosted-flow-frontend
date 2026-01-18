import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../api';

export function useUnarchiveActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activitiesApi.unarchive(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', id] });
    },
  });
}
