# Testing Strategy

## Philosophy

**Test what matters, skip what doesn't.** Test business logic and security boundaries, not library internals or trivial UI rendering.

### What We Test
- Custom logic (stores, utilities, guards)
- Security boundaries (route protection, token handling)
- Complex flows (token refresh, error recovery)

### What We DON'T Test
- Library behavior (Zod validation, React Hook Form, TanStack Query)
- Simple component rendering (no complex conditional logic)
- TypeScript types (compiler handles this)
- Trivial getters/setters without logic

---

## Test Types

| Type | Purpose | Tools | When to Use |
|------|---------|-------|-------------|
| **Unit** | Test isolated functions/modules | Vitest | Stores, utilities, guards, pure functions |
| **Integration** | Test modules working together | Vitest + MSW | API client, hooks that make HTTP calls |
| **E2E** | Test full user flows in browser | Playwright | Critical user journeys (login flow, checkout) |

### Current Coverage

```
Unit Tests:
├── auth-store.test.ts      # Reactive store, JWT parsing, subscriptions
└── auth-guard.test.ts      # Route protection (requireAuth, requireGuest)

Integration Tests:
└── api-client.test.ts      # HTTP requests, token refresh, error handling
```

---

## Conventions

### File Naming
- Test files live next to source: `auth-store.ts` → `auth-store.test.ts`
- Integration tests that need shared setup can go in `src/test/integration/`

### Test Structure
```typescript
describe('moduleName', () => {
  describe('functionOrFeature', () => {
    it('does expected behavior when condition', () => {
      // Arrange → Act → Assert
    });
  });
});
```

### Naming Tests
- Start with what it **does**: `returns`, `throws`, `calls`, `redirects`
- Include the **condition**: `when authenticated`, `on 401 response`
- Be specific: `throws redirect to /login when not authenticated`

---

## Tools

### Vitest
- Test runner, built into Vite
- Config in `vite.config.ts` under `test` key
- Globals enabled (`describe`, `it`, `expect` without imports)

### MSW (Mock Service Worker)
- Mocks HTTP requests at network level
- Handlers in `src/test/mocks/handlers.ts`
- Server setup in `src/test/mocks/server.ts`
- Use `server.use()` to override handlers per-test

### When to Use MSW
```typescript
// ✅ Use MSW for: API client tests, hooks that fetch data
const server = setupServer(
  http.get('/api/users', () => HttpResponse.json([{ id: 1 }]))
);

// ❌ Don't use MSW for: Unit tests of pure functions
// Just test the function directly
```

---

## Patterns

### Testing Stores
```typescript
beforeEach(() => {
  // Reset store state before each test
  store.reset(); // or store.setState(initialState)
});
```

### Testing Guards (that throw redirects)
```typescript
// Mock the redirect function to capture the throw
vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((opts) => {
    throw { __isRedirect: true, to: opts.to };
  }),
}));

it('redirects when not authenticated', () => {
  expect(() => requireAuth()).toThrow();
  // Optionally verify redirect target
});
```

### Testing API Calls with Token Refresh
```typescript
// Start with expired token, verify refresh happens
authStore.setAccessToken('expired-token');
await apiClient('/protected');
expect(authStore.getAccessToken()).toBe('new-token');
```

### Testing Error Cases
```typescript
// Override handler for specific test
server.use(
  http.get('/endpoint', () => {
    return HttpResponse.json({ message: 'Error' }, { status: 500 });
  })
);

await expect(apiClient('/endpoint')).rejects.toThrow(ApiError);
```

---

## What NOT to Test (Examples)

### ❌ Zod Schema Validation
```typescript
// Don't do this - you're testing Zod, not your code
it('validates email format', () => {
  expect(loginSchema.safeParse({ email: 'bad' })).toHaveProperty('success', false);
});
```

### ❌ React Hook Form Integration
```typescript
// Don't do this - RHF is battle-tested
it('shows error when field is invalid', () => {
  render(<LoginForm />);
  // ... test form validation display
});
```

### ❌ TanStack Query Wrapper Hooks
```typescript
// Don't do this - it's just a thin wrapper
it('calls login API', () => {
  // useLogin just wraps useMutation + authApi.login
  // The API client is already tested
});
```

### ❌ Simple Component Rendering
```typescript
// Don't do this unless there's complex conditional logic
it('renders login button', () => {
  render(<LoginForm />);
  expect(screen.getByText('Sign in')).toBeInTheDocument();
});
```

---

## When to Add E2E Tests

Add Playwright/Cypress E2E tests when:
- You have critical user journeys (payment flow, onboarding)
- You need to test cross-browser compatibility
- Integration between frontend and real backend matters
- You're preparing for production deployment

For this project, **unit + integration tests are sufficient**.

---

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode (during development)
npm test -- --watch

# Run specific file
npm test -- auth-store

# Run with coverage
npm test -- --coverage
```

---

## Adding New Tests Checklist

1. **Is this custom logic?** If it's library behavior, skip it
2. **Is this a security boundary?** If yes, test it thoroughly
3. **Is this complex flow?** If yes, test happy path + main error cases
4. **Can a bug here break the app?** If yes, test it
5. **Is this trivial?** If yes, skip it

When in doubt, ask: "Would I catch a real bug with this test?"
