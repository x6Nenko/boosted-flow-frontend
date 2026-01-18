import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../api';
import type { UpdateActivityRequest } from '../types';

export function useUpdateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityRequest }) =>
      activitiesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities', id] });
    },
  });
}
