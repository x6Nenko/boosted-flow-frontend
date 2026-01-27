import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type {
  TimeEntry,
  StartTimeEntryRequest,
  StopTimeEntryRequest,
  CreateManualTimeEntryRequest,
  UpdateTimeEntryRequest,
  TimeEntriesQuery,
  CurrentEntryResponse,
} from './types';

export const timeEntriesApi = {
  start: (data: StartTimeEntryRequest) =>
    apiClient<TimeEntry>(API_ENDPOINTS.TIME_ENTRIES.START, {
      method: 'POST',
      body: data,
    }),

  stop: ({ id, distractionCount }: StopTimeEntryRequest) =>
    apiClient<TimeEntry>(API_ENDPOINTS.TIME_ENTRIES.STOP, {
      method: 'POST',
      body: { id, ...(distractionCount !== undefined && { distractionCount }) },
    }),

  createManual: (data: CreateManualTimeEntryRequest) =>
    apiClient<TimeEntry>(API_ENDPOINTS.TIME_ENTRIES.MANUAL, {
      method: 'POST',
      body: data,
    }),

  update: (id: string, data: UpdateTimeEntryRequest) =>
    apiClient<TimeEntry>(`${API_ENDPOINTS.TIME_ENTRIES.LIST}/${id}`, {
      method: 'PATCH',
      body: data,
    }),

  delete: (id: string) =>
    apiClient<void>(`${API_ENDPOINTS.TIME_ENTRIES.LIST}/${id}`, {
      method: 'DELETE',
    }),

  list: (query?: TimeEntriesQuery) => {
    const params = new URLSearchParams();
    if (query?.activityId) params.set('activityId', query.activityId);
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    const queryString = params.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.TIME_ENTRIES.LIST}?${queryString}`
      : API_ENDPOINTS.TIME_ENTRIES.LIST;
    return apiClient<TimeEntry[]>(endpoint);
  },

  current: () => apiClient<CurrentEntryResponse>(API_ENDPOINTS.TIME_ENTRIES.CURRENT),
};
