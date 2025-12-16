import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '../api';
import type { CurrentEntryResponse } from '../types';

export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.stop({ id }),
    onSuccess: () => {
      queryClient.setQueryData<CurrentEntryResponse>(['time-entries', 'current'], {
        entry: null,
      });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}
