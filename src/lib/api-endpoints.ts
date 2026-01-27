export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    GOOGLE: '/auth/google',
    EXCHANGE: '/auth/exchange',
  },
  ACTIVITIES: {
    BASE: '/activities',
  },
  TIME_ENTRIES: {
    START: '/time-entries/start',
    STOP: '/time-entries/stop',
    MANUAL: '/time-entries/manual',
    LIST: '/time-entries',
    CURRENT: '/time-entries/current',
  },
} as const;
