import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type { Tag } from '../time-entries/types';

export const tagsApi = {
  list: () => apiClient<Tag[]>(API_ENDPOINTS.TAGS.BASE),

  getOrCreate: (names: string[]) =>
    apiClient<Tag[]>(API_ENDPOINTS.TAGS.GET_OR_CREATE, {
      method: 'POST',
      body: { names },
    }),

  delete: (id: string) =>
    apiClient<void>(`${API_ENDPOINTS.TAGS.BASE}/${id}`, {
      method: 'DELETE',
    }),
};
