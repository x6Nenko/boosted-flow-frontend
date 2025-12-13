type AuthStore = {
  accessToken: string | null;
};

// In-memory store for access token
let store: AuthStore = {
  accessToken: null,
};

// Subscribers for reactivity
const subscribers = new Set<() => void>();

export const authStore = {
  getAccessToken: () => store.accessToken,

  setAccessToken: (token: string | null) => {
    store.accessToken = token;
    subscribers.forEach((callback) => callback());
  },

  isAuthenticated: () => store.accessToken !== null,

  subscribe: (callback: () => void) => {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },

  // Parse user from JWT (without external library)
  getUser: () => {
    const token = store.accessToken;
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { userId: payload.sub };
    } catch {
      return null;
    }
  },
};
