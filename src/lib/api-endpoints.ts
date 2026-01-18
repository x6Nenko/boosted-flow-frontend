/**
 * Centralized API endpoint constants
 * Prevents hardcoded strings scattered throughout the codebase
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  ACTIVITIES: {
    BASE: '/activities',
  },
  TIME_ENTRIES: {
    START: '/time-entries/start',
    STOP: '/time-entries/stop',
    LIST: '/time-entries',
    CURRENT: '/time-entries/current',
  },
  TAGS: {
    BASE: '/tags',
    GET_OR_CREATE: '/tags/get-or-create',
  },
} as const;
