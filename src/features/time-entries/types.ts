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
  distractionCount: number;
  createdAt: string;
  tags?: Tag[];
};

/**
 * Tag as returned from the API
 */
export type Tag = {
  id: string;
  userId: string;
  name: string;
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
  distractionCount?: number;
};

/**
 * Request to update a finished time entry
 */
export type UpdateTimeEntryRequest = {
  rating?: number;
  comment?: string;
  tagIds?: string[];
  distractionCount?: number;
};

/**
 * Query params for fetching time entries
 */
export type TimeEntriesQuery = {
  activityId?: string;
  from?: string;
  to?: string;
};

/**
 * Response wrapper for current entry (null-safe)
 */
export type CurrentEntryResponse = {
  entry: TimeEntry | null;
};
