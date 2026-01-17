/**
 * Time entry as returned from the API
 */
export type TimeEntry = {
  id: string;
  userId: string;
  activityId: string;
  description: string | null;
  startedAt: string;
  stoppedAt: string | null;
  rating: number | null;
  comment: string | null;
  createdAt: string;
};

/**
 * Request to start a new time entry
 */
export type StartTimeEntryRequest = {
  activityId: string;
  description?: string;
};

/**
 * Request to stop an active time entry
 */
export type StopTimeEntryRequest = {
  id: string;
};

/**
 * Request to update a finished time entry
 */
export type UpdateTimeEntryRequest = {
  rating?: number;
  comment?: string;
};

/**
 * Query params for fetching time entries
 */
export type TimeEntriesQuery = {
  from?: string;
  to?: string;
};

/**
 * Response wrapper for current entry (null-safe)
 */
export type CurrentEntryResponse = {
  entry: TimeEntry | null;
};
