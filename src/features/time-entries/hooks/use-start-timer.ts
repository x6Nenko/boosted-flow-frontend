import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '../api';
import type { CurrentEntryResponse, StartTimeEntryRequest, TimeEntry } from '../types';

type StartTimerContext = {
  previous: CurrentEntryResponse | undefined;
  startedAt: string;
};

export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartTimeEntryRequest) => timeEntriesApi.start(data),
    onMutate: (data) => {
      const startedAt = new Date().toISOString();
      const previous = queryClient.getQueryData<CurrentEntryResponse>(['time-entries', 'current']);
      const optimisticEntry: TimeEntry = {
        id: `optimistic-${startedAt}`,
        userId: '',
        activityId: data.activityId,
        description: data.description ?? null,
        startedAt,
        stoppedAt: null,
        rating: null,
        comment: null,
        distractionCount: 0,
        createdAt: startedAt,
      };

      queryClient.setQueryData<CurrentEntryResponse>(['time-entries', 'current'], {
        entry: optimisticEntry,
      });

      return { previous, startedAt } satisfies StartTimerContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<CurrentEntryResponse>(['time-entries', 'current'], context.previous);
      } else {
        queryClient.setQueryData<CurrentEntryResponse>(['time-entries', 'current'], { entry: null });
      }
    },
    onSuccess: (entry: TimeEntry, _variables, context) => {
      let nextEntry = entry;
      const clientStartedAt = context?.startedAt;

      if (clientStartedAt) {
        const serverMs = new Date(entry.startedAt).getTime();
        const clientMs = new Date(clientStartedAt).getTime();
        const diffMs = serverMs - clientMs;
        const shouldAdjust = diffMs > 500 && diffMs <= 30_000; // half a second to 30 seconds

        if (shouldAdjust) {
          nextEntry = { ...entry, startedAt: clientStartedAt };
          void timeEntriesApi.update(entry.id, { startedAt: clientStartedAt });
        }
      }

      queryClient.setQueryData<CurrentEntryResponse>(['time-entries', 'current'], {
        entry: nextEntry,
      });
      queryClient.invalidateQueries({
        queryKey: ['time-entries'],
        predicate: (query) => query.queryKey[1] !== 'current',
      });
    },
  });
}
