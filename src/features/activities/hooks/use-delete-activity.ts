import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../api';

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activitiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
