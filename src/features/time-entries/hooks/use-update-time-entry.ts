import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '../api';
import type { UpdateTimeEntryRequest } from '../types';

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeEntryRequest }) =>
      timeEntriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}
