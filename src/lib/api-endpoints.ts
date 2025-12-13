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
} as const;
