import { apiClient } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-endpoints';
import type {
  TimeEntry,
  StartTimeEntryRequest,
  StopTimeEntryRequest,
  TimeEntriesQuery,
  CurrentEntryResponse,
} from './types';

export const timeEntriesApi = {
  start: (data?: StartTimeEntryRequest) =>
    apiClient<TimeEntry>(API_ENDPOINTS.TIME_ENTRIES.START, {
      method: 'POST',
      body: data,
    }),

  stop: (data: StopTimeEntryRequest) =>
    apiClient<TimeEntry>(API_ENDPOINTS.TIME_ENTRIES.STOP, {
      method: 'POST',
      body: data,
    }),

  list: (query?: TimeEntriesQuery) => {
    const params = new URLSearchParams();
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
