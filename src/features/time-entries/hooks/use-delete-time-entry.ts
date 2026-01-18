import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '../api';

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}
