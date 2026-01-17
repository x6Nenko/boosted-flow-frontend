import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type { Activity, CreateActivityRequest } from './types';

export const activitiesApi = {
  create: (data: CreateActivityRequest) =>
    apiClient<Activity>(API_ENDPOINTS.ACTIVITIES.BASE, {
      method: 'POST',
      body: data,
    }),

  list: (includeArchived = false) => {
    const params = new URLSearchParams();
    if (includeArchived) params.set('includeArchived', 'true');
    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.ACTIVITIES.BASE}?${queryString}`
      : API_ENDPOINTS.ACTIVITIES.BASE;
    return apiClient<Activity[]>(endpoint);
  },
};
