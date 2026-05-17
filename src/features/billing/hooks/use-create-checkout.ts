import { useMutation } from '@tanstack/react-query';
import { billingApi } from '../api';

export function useCreateCheckout() {
  return useMutation({
    mutationFn: billingApi.createCheckout,
  });
}
