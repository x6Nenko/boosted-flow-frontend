import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStore } from './auth-store';

// Valid JWT with payload: { sub: 'user-123' }
const VALID_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature';

// Invalid base64 that will fail parsing
const INVALID_TOKEN = 'not.valid.jwt';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    authStore.setAccessToken(null);
  });

  describe('getAccessToken / setAccessToken', () => {
    it('returns null when no token is set', () => {
      expect(authStore.getAccessToken()).toBeNull();
    });

    it('returns token after setting it', () => {
      authStore.setAccessToken(VALID_TOKEN);
      expect(authStore.getAccessToken()).toBe(VALID_TOKEN);
    });

    it('returns null after clearing token', () => {
      authStore.setAccessToken(VALID_TOKEN);
      authStore.setAccessToken(null);
      expect(authStore.getAccessToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no token', () => {
      expect(authStore.isAuthenticated()).toBe(false);
    });

    it('returns true when token exists', () => {
      authStore.setAccessToken(VALID_TOKEN);
      expect(authStore.isAuthenticated()).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('calls subscriber when token changes', () => {
      const subscriber = vi.fn();
      authStore.subscribe(subscriber);

      authStore.setAccessToken(VALID_TOKEN);

      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('unsubscribes correctly', () => {
      const subscriber = vi.fn();
      const unsubscribe = authStore.subscribe(subscriber);

      unsubscribe();
      authStore.setAccessToken(VALID_TOKEN);

      expect(subscriber).not.toHaveBeenCalled();
    });

    it('notifies multiple subscribers', () => {
      const subscriber1 = vi.fn();
      const subscriber2 = vi.fn();
      authStore.subscribe(subscriber1);
      authStore.subscribe(subscriber2);

      authStore.setAccessToken(VALID_TOKEN);

      expect(subscriber1).toHaveBeenCalledTimes(1);
      expect(subscriber2).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUser', () => {
    it('returns null when no token', () => {
      expect(authStore.getUser()).toBeNull();
    });

    it('extracts userId from valid JWT', () => {
      authStore.setAccessToken(VALID_TOKEN);
      expect(authStore.getUser()).toEqual({ userId: 'user-123' });
    });

    it('returns null for invalid JWT', () => {
      authStore.setAccessToken(INVALID_TOKEN);
      expect(authStore.getUser()).toBeNull();
    });
  });
});
