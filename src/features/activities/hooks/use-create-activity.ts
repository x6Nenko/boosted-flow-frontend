import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '../api';
import type { CreateActivityRequest } from '../types';

export function useCreateActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateActivityRequest) => activitiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
