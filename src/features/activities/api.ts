import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type { Activity, CreateActivityRequest, UpdateActivityRequest } from './types';

export const activitiesApi = {
  create: (data: CreateActivityRequest) =>
    apiClient<Activity>(API_ENDPOINTS.ACTIVITIES.BASE, {
      method: 'POST',
      body: data,
    }),

  get: (id: string) =>
    apiClient<Activity>(`${API_ENDPOINTS.ACTIVITIES.BASE}/${id}`),

  list: (includeArchived = false) => {
    const params = new URLSearchParams();
    if (includeArchived) params.set('includeArchived', 'true');
    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.ACTIVITIES.BASE}?${queryString}`
      : API_ENDPOINTS.ACTIVITIES.BASE;
    return apiClient<Activity[]>(endpoint);
  },

  update: (id: string, data: UpdateActivityRequest) =>
    apiClient<Activity>(`${API_ENDPOINTS.ACTIVITIES.BASE}/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  archive: (id: string) =>
    apiClient<Activity>(`${API_ENDPOINTS.ACTIVITIES.BASE}/${id}/archive`, {
      method: 'POST',
    }),

  unarchive: (id: string) =>
    apiClient<Activity>(`${API_ENDPOINTS.ACTIVITIES.BASE}/${id}/unarchive`, {
      method: 'POST',
    }),

  delete: (id: string) =>
    apiClient<void>(`${API_ENDPOINTS.ACTIVITIES.BASE}/${id}`, {
      method: 'DELETE',
    }),
};
