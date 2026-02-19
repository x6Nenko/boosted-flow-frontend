# JWT Authentication System Architecture

## 1. High-Level Purpose

Enables secure user authentication using JWT access tokens (in-memory) and refresh tokens (HttpOnly cookies), with automatic session restoration, protected route navigation, and Google OAuth support.

---

## 2. Component & Hook Hierarchy

```
src/
├── main.tsx (App initialization with initializeAuth)
├── lib/
│   ├── api-client.ts (HTTP client with auto-refresh)
│   └── api-endpoints.ts (Centralized API endpoint constants)
├── features/auth/
│   ├── types.ts (TypeScript definitions)
│   ├── auth-store.ts (In-memory access token store with pub-sub)
│   ├── api.ts (Auth API endpoints using API_ENDPOINTS)
│   ├── auth-guard.ts (Route guards & session init)
│   ├── auth.schema.ts (Zod validation schemas)
│   ├── components/
│   │   ├── LoginForm.tsx (Login form with react-hook-form + Google OAuth)
│   │   ├── RegisterForm.tsx (Registration form with react-hook-form + Google OAuth)
│   │   ├── GoogleSignInButton.tsx (Google OAuth button component)
│   │   ├── ForgotPasswordForm.tsx (Forgot password request form)
│   │   └── ResetPasswordForm.tsx (Password reset form with token)
│   └── hooks/
│       ├── use-auth.ts (Subscribe to auth state)
│       ├── use-login.ts (TanStack Mutation)
│       ├── use-register.ts (TanStack Mutation)
│       ├── use-logout.ts (TanStack Mutation + cache clear)
│       ├── use-google-auth.ts (Google OAuth initiation + code exchange)
│       ├── use-forgot-password.ts (TanStack Mutation for password reset request)
│       └── use-reset-password.ts (TanStack Mutation for password reset)
├── routes/
│   ├── index.tsx (Public landing - redirects authenticated users)
│   ├── _auth.tsx (Layout route with requireAuth guard)
│   ├── _guest.tsx (Layout route with requireGuest guard)
│   ├── _auth/dashboard.tsx (Protected page)
│   ├── _guest/login.tsx (Renders LoginForm)
│   ├── _guest/register.tsx (Renders RegisterForm)
│   ├── _guest/forgot-password.tsx (Renders ForgotPasswordForm)
│   ├── _guest/reset-password.tsx (Renders ResetPasswordForm with token from URL)
│   └── auth/callback.tsx (OAuth callback handler)
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
1. User enters credentials → `LoginForm` component (react-hook-form)
2. Form validation via Zod schema (`loginSchema`) - email format + password required
3. On valid submission → `useLogin().mutate({ email, password })` triggered
4. TanStack Mutation → `authApi.login()` → `apiClient` POST to `API_ENDPOINTS.AUTH.LOGIN`
5. Response: `{ accessToken: "..." }` + HttpOnly `refreshToken` cookie
6. `onSuccess` → `authStore.setAccessToken(token)` → notify subscribers
7. `navigate({ to: '/dashboard' })` (programmatic redirect)
8. `_auth.tsx` `beforeLoad` guard passes → dashboard renders

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

### **Google OAuth Flow**
1. User clicks "Sign in with Google" → `GoogleSignInButton` component
2. `useGoogleAuth().initiateGoogleAuth()` → redirect to `${API_BASE_URL}/auth/google`
3. Backend redirects to Google consent screen
4. User authenticates with Google
5. Google redirects to backend callback → backend issues one-time code
6. Backend redirects to `/auth/callback?code=...`
7. `AuthCallbackPage` extracts code → `useGoogleAuth().exchangeCode.mutate(code)`
8. TanStack Mutation → `authApi.exchangeCode()` → POST `/auth/exchange`
9. Response: `{ accessToken: "..." }` + HttpOnly `refreshToken` cookie
10. `onSuccess` → `authStore.setAccessToken(token)` → `navigate({ to: '/dashboard' })`

### **Forgot Password Flow**
1. User clicks "Forgot your password?" on login page → navigates to `/forgot-password`
2. User enters email → `ForgotPasswordForm` component (react-hook-form)
3. Form validation via Zod schema (`forgotPasswordSchema`) - email format
4. On valid submission → `useForgotPassword().mutate({ email })`
5. TanStack Mutation → `authApi.forgotPassword()` → POST `/auth/forgot-password`
6. Response: `{ message: "..." }` (always success to prevent enumeration)
7. Component shows success message with "Check your email" confirmation

### **Reset Password Flow**
1. User clicks reset link in email → navigates to `/reset-password?token=...`
2. Route validates token presence in URL search params
3. If no token → shows "Invalid reset link" error with link to request new one
4. If token exists → `ResetPasswordForm` component receives token prop
5. User enters new password + confirmation → form validation via `resetPasswordSchema`
6. On valid submission → `useResetPassword().mutate({ token, password })`
7. TanStack Mutation → `authApi.resetPassword()` → POST `/auth/reset-password`
8. On success → show confirmation message and a "Continue to login" link

---

## 4. Key Patterns & Configuration

### **TanStack Patterns**
- **useMutation** for all auth actions (login/register/logout)
- **useSyncExternalStore** for reactive auth state (React 18)
- **QueryClient.clear()** on logout to prevent stale data leakage
- **TanStack Router `beforeLoad`** for route-level guards

### **Form Validation Patterns**
- **React Hook Form** for form state management and submission
- **Zod schemas** for type-safe validation (`loginSchema`, `registerSchema`)
- **@hookform/resolvers/zod** integration for seamless validation
- **Client-side validation**: Email format, password requirements, confirmation matching
- **Server-side error display**: Extracted from `ApiError.data.message`

### **Turnstile CAPTCHA**
- **Package**: `@marsidev/react-turnstile` — Cloudflare's recommended React wrapper
- **Protected forms**: Login, Register, Forgot Password, Reset Password
- **Token flow**: Widget auto-solves → token stored in component state → sent as `turnstileToken` in request body → backend validates via Cloudflare API
- **Widget config**: Dark theme, flexible size, `appearance: 'interaction-only'` — renders invisibly and only shows a challenge when Cloudflare requires human verification; each widget is wrapped in `<div className="w-full">` so `size: 'flexible'` (100% of container) works correctly when the widget surfaces
- **Submit gating**: Button disabled until Turnstile token is available
- **Error recovery**: Widget resets on submission failure (`mutateAsync` + catch), token cleared on expiry/error
- **Dev testing**: Use Cloudflare's always-pass site key `1x00000000000000000000AA` with secret `1x0000000000000000000000000000000AA`

### **Auth Patterns**
- **Dual-token strategy**: Access token (in-memory, short-lived) + Refresh token (HttpOnly cookie, long-lived)
- **Pub-sub reactivity**: `authStore.subscribe()` for cross-component updates
- **Automatic token refresh**: Transparent retry on 401 with refresh token
- **Refresh deduplication**: Single refresh promise prevents race conditions
- **JWT parsing**: Manual Base64 decode for user data extraction (no library)
- **Centralized endpoints**: `API_ENDPOINTS` constant for all API routes

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

#### `useGoogleAuth()`
```ts
Returns: {
  initiateGoogleAuth: () => void  // Redirects to Google OAuth
  exchangeCode: UseMutationResult<AuthResponse, Error, string>
    - mutate(code: string)
    - isPending, isError, error
}
```

#### `useForgotPassword()`
```ts
Returns: UseMutationResult<MessageResponse, Error, ForgotPasswordRequest>
  - mutate(data: { email: string })
  - isPending, isError, error, isSuccess
```

#### `useResetPassword()`
```ts
Returns: UseMutationResult<MessageResponse, Error, ResetPasswordRequest>
  - mutate(data: { token: string; password: string })
  - isPending, isError, error
```

### **Components**

#### `GoogleSignInButton`
```ts
Props: {
  mode?: 'signin' | 'signup'  // Default: 'signin'
  disabled?: boolean
}
```
Renders Google-branded sign-in button following Google's branding guidelines.

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
- **Zod schemas**: `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema` in `auth.schema.ts`
- **Login validation**: Valid email format + password required
- **Register validation**:
  - Valid email format
  - Password 8-72 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - Confirmation must match password
- **Forgot password validation**: Valid email format
- **Reset password validation**: Same rules as register (8-72 chars, complexity, confirmation match)
- **Server errors**: Extracted from `ApiError.data.message`
- **Display priority**: Zod validation errors shown inline, server errors displayed above form

### **Environment Config**
- `VITE_API_URL` in `.env.development` / `.env.production`
- Fallback: `http://localhost:3000`
- `VITE_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key (required for CAPTCHA)
- Accessed via `import.meta.env.VITE_API_URL`

### **QueryClient Integration**
- **No query key factories** (not used in auth feature)
- **Cache cleared on logout** (prevents data leakage between users)
- Mutations don't invalidate queries (auth is self-contained state)

### **Google OAuth Rules**
- **One-time code exchange** - Backend uses short-lived codes (5 min expiry), not tokens in URLs
- **Callback route is public** - `/auth/callback` must not be behind `_guest` or `_auth` guards
- **Code consumed immediately** - `exchangeCode` mutation called on mount, code deleted on backend after use
- **Error handling** - OAuth errors redirect to login page with error display
- **Google branding** - `GoogleSignInButton` follows Google's identity branding guidelines

### **Turnstile CAPTCHA Rules**
- **Token is NOT in Zod schemas** — captured programmatically, not user input
- **Token is single-use** — backend consumes it; widget must reset on failure for retry
- **No custom hook extraction** — integration is trivial per-form wiring (state + ref + widget)
- **Google OAuth bypasses CAPTCHA** — OAuth flow has its own bot protection
- **Always-pass keys for dev** — Site key: `1x00000000000000000000AA`, Secret: `1x0000000000000000000000000000000AA`
