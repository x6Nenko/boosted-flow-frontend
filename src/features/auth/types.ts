// API Response Types
export type AuthResponse = {
  accessToken: string;
};

// Request Types
export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type ExchangeCodeRequest = {
  code: string;
};

// Auth State
export type AuthState = {
  accessToken: string | null;
  isAuthenticated: boolean;
};

// User from JWT payload (minimal - only userId)
export type AuthUser = {
  userId: string;
};
