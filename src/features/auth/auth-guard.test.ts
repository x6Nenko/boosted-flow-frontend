import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authStore } from './auth-store';

// Mock TanStack Router's redirect
vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((opts) => {
    throw { __isRedirect: true, to: opts.to };
  }),
}));

// Import after mocking
import { requireAuth, requireGuest } from './auth-guard';

const VALID_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.sig';

describe('auth guards', () => {
  beforeEach(() => {
    authStore.setAccessToken(null);
  });

  describe('requireAuth', () => {
    it('throws redirect to /login when not authenticated', () => {
      expect(() => requireAuth()).toThrow();

      try {
        requireAuth();
      } catch (e) {
        expect(e).toMatchObject({ __isRedirect: true, to: '/login' });
      }
    });

    it('does not throw when authenticated', () => {
      authStore.setAccessToken(VALID_TOKEN);
      expect(() => requireAuth()).not.toThrow();
    });
  });

  describe('requireGuest', () => {
    it('throws redirect to / when authenticated', () => {
      authStore.setAccessToken(VALID_TOKEN);

      expect(() => requireGuest()).toThrow();

      try {
        requireGuest();
      } catch (e) {
        expect(e).toMatchObject({ __isRedirect: true, to: '/' });
      }
    });

    it('does not throw when not authenticated', () => {
      expect(() => requireGuest()).not.toThrow();
    });
  });
});
