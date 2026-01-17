import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '../api';
import type { CurrentEntryResponse, StartTimeEntryRequest, TimeEntry } from '../types';

export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartTimeEntryRequest) => timeEntriesApi.start(data),
    onSuccess: (entry: TimeEntry) => {
      queryClient.setQueryData<CurrentEntryResponse>(['time-entries', 'current'], {
        entry,
      });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}
