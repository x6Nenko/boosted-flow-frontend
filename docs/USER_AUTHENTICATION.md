# JWT Authentication System Architecture

## 1. High-Level Purpose

Enables secure user authentication using JWT access tokens (in-memory) and refresh tokens (HttpOnly cookies), with automatic session restoration and protected route navigation.

---

## 2. Component & Hook Hierarchy

```
src/
├── main.tsx (App initialization with initializeAuth)
├── lib/
│   └── api-client.ts (HTTP client with auto-refresh)
├── features/auth/
│   ├── types.ts (TypeScript definitions)
│   ├── auth-store.ts (In-memory access token store with pub-sub)
│   ├── api.ts (Auth API endpoints)
│   ├── auth-guard.ts (Route guards & session init)
│   └── hooks/
│       ├── use-auth.ts (Subscribe to auth state)
│       ├── use-login.ts (TanStack Mutation)
│       ├── use-register.ts (TanStack Mutation)
│       └── use-logout.ts (TanStack Mutation + cache clear)
├── routes/
│   ├── index.tsx (Public landing - redirects authenticated users)
│   ├── _auth.tsx (Layout route with requireAuth guard)
│   ├── _guest.tsx (Layout route with requireGuest guard)
│   ├── _auth/dashboard.tsx (Protected page)
│   ├── _guest/login.tsx (Login form component)
│   └── _guest/register.tsx (Registration form component)
```

---

## 3. State & Data Flow

### **Initial Load**
1. `main.tsx` calls `initializeAuth()` before rendering
2. Check if access token exists in `authStore`
3. If no token → call `/auth/refresh` with credentials (HttpOnly cookie)
4. On success → store access token in memory / On failure → set token to null
5. Render app (TanStack Router evaluates `beforeLoad` guards)

### **Login Flow**
1. User enters credentials → `LoginPage` form submission
2. `useLogin().mutate({ email, password })` triggered
3. TanStack Mutation → `authApi.login()` → `apiClient` POST to `/auth/login`
4. Response: `{ accessToken: "..." }` + HttpOnly `refreshToken` cookie
5. `onSuccess` → `authStore.setAccessToken(token)` → notify subscribers
6. `navigate({ to: '/dashboard' })` (programmatic redirect)
7. `_auth.tsx` `beforeLoad` guard passes → dashboard renders

### **Protected Route Access**
1. User navigates to `/dashboard`
2. `_auth.tsx` `beforeLoad` → checks `authStore.isAuthenticated()`
3. If false → `throw redirect({ to: '/login' })`
4. If true → `<Outlet />` renders child route

### **API Request with Auto-Refresh**
1. Component calls API via `apiClient('/some-endpoint')`
2. Attach `Authorization: Bearer {accessToken}` header
3. If 401 response + not `/auth/*` endpoint:
   - Deduplicate: check if `refreshPromise` already pending
   - Call `/auth/refresh` → get new access token
   - Retry original request with new token
   - If refresh fails → throw 401 error (user kicked to login)
4. Return data to caller

### **Logout Flow**
1. User clicks logout → `useLogout().mutate()`
2. TanStack Mutation → `authApi.logout()` → POST `/auth/logout`
3. `onSuccess` (or `onError` - always execute):
   - `authStore.setAccessToken(null)`
   - `queryClient.clear()` (purge all cached data)
   - `navigate({ to: '/login' })`

---

## 4. Key Patterns & Configuration

### **TanStack Patterns**
- **useMutation** for all auth actions (login/register/logout)
- **useSyncExternalStore** for reactive auth state (React 18)
- **QueryClient.clear()** on logout to prevent stale data leakage
- **TanStack Router `beforeLoad`** for route-level guards

### **Auth Patterns**
- **Dual-token strategy**: Access token (in-memory, short-lived) + Refresh token (HttpOnly cookie, long-lived)
- **Pub-sub reactivity**: `authStore.subscribe()` for cross-component updates
- **Automatic token refresh**: Transparent retry on 401 with refresh token
- **Refresh deduplication**: Single refresh promise prevents race conditions
- **JWT parsing**: Manual Base64 decode for user data extraction (no library)

### **React Router Patterns**
- **Layout routes** (`_auth`, `_guest`) for guard encapsulation
- **`throw redirect()`** for imperative navigation in guards
- **`useNavigate()`** for programmatic redirects in mutations

### **Error Handling**
- **Custom ApiError class** with status, statusText, and typed data
- **Instance checks** (`error instanceof ApiError`) for error type discrimination
- **Typed error data**: `(error.data as { message?: string })?.message`

---

## 5. Public Interface

### **Hooks**

#### `useAuth()`
```ts
Returns: {
  accessToken: string | null
  isAuthenticated: boolean
  user: { userId: string } | null
}
```

#### `useLogin()`
```ts
Returns: UseMutationResult<AuthResponse, Error, LoginRequest>
  - mutate(data: { email: string; password: string })
  - isPending, isError, error
```

#### `useRegister()`
```ts
Returns: UseMutationResult<AuthResponse, Error, RegisterRequest>
  - mutate(data: { email: string; password: string })
  - isPending, isError, error
```

#### `useLogout()`
```ts
Returns: UseMutationResult<void, Error, void>
  - mutate()
  - isPending
```

### **API Client**

#### `apiClient<T>(endpoint, options?)`
```ts
Params:
  - endpoint: string (relative path, e.g., '/users')
  - options?: { method?, body?, headers?, skipAuth? }
Returns: Promise<T>
Throws: ApiError (status, statusText, data)
```

### **Guards**

#### `initializeAuth()`
```ts
Promise<void> - Call once on app bootstrap
```

#### `requireAuth()`
```ts
void | throws redirect({ to: '/login' })
```

#### `requireGuest()`
```ts
void | throws redirect({ to: '/' })
```

---

## 6. "Gotchas" & Rules

### **Critical Constraints**
1. **Must call `initializeAuth()` before React renders** - Prevents flash of login screen for authenticated users
2. **Access token is in-memory only** - Lost on page refresh (intentional security measure)
3. **Refresh token is HttpOnly cookie** - Frontend cannot access it (set by backend)
4. **Always use `credentials: 'include'`** - Required for cookie transmission in CORS
5. **Logout must always clear state** - Even on API error (handle in `onError` callback)
6. **Never store access token in localStorage/sessionStorage** - XSS vulnerability

### **Token Refresh Rules**
- Only auto-refresh on **401 responses**
- Skip refresh for `/auth/*` endpoints (prevents infinite loops)
- Deduplicate concurrent refresh calls (single `refreshPromise` gate)
- Clear token on refresh failure (force re-login)

### **Type Safety**
- All auth types exported from `features/auth/types.ts`
- API responses typed via `apiClient<T>()`
- Error data requires casting: `error.data as { message?: string }`

### **Route Guards**
- **Layout routes** (`_auth`, `_guest`) apply guards to all children
- Guards use `throw redirect()` not `navigate()` (synchronous evaluation)
- `beforeLoad` runs **before** component render (no flash of unauthorized content)

### **Form Validation**
- **Client-side**: Password 8-72 chars, match confirmation
- **Server errors**: Extract from `ApiError.data.message`
- **Display**: Show validation errors above server errors

### **Environment Config**
- `VITE_API_URL` in `.env.development` / `.env.production`
- Fallback: `http://localhost:3000`
- Accessed via `import.meta.env.VITE_API_URL`

### **QueryClient Integration**
- **No query key factories** (not used in auth feature)
- **Cache cleared on logout** (prevents data leakage between users)
- Mutations don't invalidate queries (auth is self-contained state)
