/**
 * Activity as returned from the API
 */
export type Activity = {
  id: string;
  userId: string;
  name: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Request to create a new activity
 */
export type CreateActivityRequest = {
  name: string;
};

/**
 * Request to update an activity
 */
export type UpdateActivityRequest = {
  name: string;
};

/**
 * Predefined activity suggestions
 */
export const ACTIVITY_SUGGESTIONS = [
  'Reading',
  'Coding',
  'Writing',
  'Studying',
  'Exercise',
  'Meditation',
  'Learning',
  'Drawing',
  'Music',
  'Cooking',
] as const;
