import { useMutation } from '@tanstack/react-query';
import { billingApi } from '../api';

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: billingApi.createPortalSession,
  });
}
