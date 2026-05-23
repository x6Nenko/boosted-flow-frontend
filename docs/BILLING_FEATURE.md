# Billing Feature Architecture

## 1. High-Level Purpose

Keeps authenticated app access aligned with backend billing status. The frontend shows trial/subscription state, redirects expired users to the billing page, starts Paddle checkout, and opens the hosted Paddle portal for active subscribers.

---

## 2. Component & Hook Hierarchy

```
src/features/billing/
├── types.ts                         # Billing status, checkout, and portal response types
├── api.ts                           # Billing status, checkout, and portal API calls
├── billing-guard.ts                 # Auth route billing access check
├── paddle.ts                        # Paddle.js initialization and checkout opening
├── portal.ts                        # Current-tab portal redirect helper
└── hooks/
    ├── index.ts                     # Hook exports
    ├── use-billing-status.ts        # TanStack Query status fetch
    ├── use-create-checkout.ts       # TanStack Mutation for checkout creation
    └── use-create-portal-session.ts # TanStack Mutation for portal sessions

routes/
├── _auth.tsx                        # Requires auth, then checks billing access
└── _auth/billing.tsx                # Billing status, checkout CTA, portal CTA
```

**Page:**
- `/billing` - Shows current access state and subscription action

---

## 3. State & Data Flow

### **Loading Billing Status**
1. User enters an authenticated route
2. `_auth.tsx` verifies auth first
3. `requireBillingAccess()` fetches `GET /billing/status`
4. If `hasActiveAccess` is false and the route is not `/billing`, redirect to `/billing`
5. `/billing` renders trial, subscription, or expired-access paywall state from the same backend status

### **Checkout**
1. Expired user clicks "Subscribe"
2. `useCreateCheckout()` calls `POST /billing/checkout`
3. Backend returns `{ transactionId }`
4. Frontend opens Paddle checkout with that transaction id
5. On Paddle checkout completion, frontend refetches `/billing/status` briefly
6. App access is only restored after the backend status changes, usually from Paddle webhooks

### **Customer Portal**
1. Active subscriber clicks "Manage subscription"
2. `useCreatePortalSession()` calls `POST /billing/portal-session`
3. Backend returns `{ url }`
4. Frontend redirects the current tab to that Paddle-hosted portal URL

---

## 4. Key Patterns & Configuration

| Pattern | Implementation |
|---------|----------------|
| **Backend Source of Truth** | UI access state comes from `GET /billing/status` |
| **No Frontend Unlock** | Paddle success events only trigger status refetches |
| **Route-Level Paywall** | `_auth` redirects expired users to `/billing` |
| **Typed API Layer** | `api.ts` wraps billing endpoints through `apiClient` |
| **Paddle Client Token** | Paddle.js uses `VITE_PADDLE_CLIENT_TOKEN`, not server API keys |
| **Hosted Portal** | Active subscribers get a fresh Paddle portal session before redirect |

### Environment Variables

```text
VITE_PADDLE_CLIENT_TOKEN=
VITE_PADDLE_ENVIRONMENT=sandbox
```

---

## 5. Public Interface

### **Hooks**

#### `useBillingStatus()`
```typescript
Returns: UseQueryResult<BillingStatus>
```

#### `useCreateCheckout()`
```typescript
Returns: UseMutationResult<CheckoutResponse, Error, void>
```

#### `useCreatePortalSession()`
```typescript
Returns: UseMutationResult<PortalSessionResponse, Error, void>
```

### **API**

```typescript
billingApi.getStatus()             // GET /billing/status
billingApi.createCheckout()        // POST /billing/checkout
billingApi.createPortalSession()   // POST /billing/portal-session
```

### **Paddle**

```typescript
openPaddleCheckout(transactionId, onEvent)
```

Initializes Paddle.js lazily and opens checkout for a backend-created transaction.

---

## 6. Rules & Gotchas

1. **Do not trust Paddle frontend completion**: always wait for backend `/billing/status`
2. **Do not add price IDs to the frontend**: backend creates the checkout transaction
3. **Do not cache portal URLs**: create a fresh portal session for each manage action
4. **Keep `/billing` reachable without active access**: expired users need it to subscribe
5. **Product API 403s are backend enforcement**: frontend route checks are UX, not security
